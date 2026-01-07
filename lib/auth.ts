import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { pool } from "@/lib/db";
import { compare, hash } from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import { TwoFactorAuthEmail } from "@/emails/TwoFactorAuthEmail";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("Email es requerido.");
        }
        
        const client = await pool.connect();
        try {
          // --- CORRECCIÓN: Se añade 'primer_login' a la consulta ---
          const userRes = await client.query(
            'SELECT u.*, r.nombre as rol_nombre FROM usuarios u LEFT JOIN roles r ON u.rol_id = r.id WHERE u.email = $1',
            [credentials.email.toLowerCase()]
          );

          if (userRes.rows.length === 0) {
            throw new Error("Email o contraseña incorrectos.");
          }
          
          const user = userRes.rows[0];

          if (!user.activo) {
            // Si el usuario no está activo pero la contraseña es correcta y es su primer inicio de sesión, activarlo.
            if (user.primer_login) {
              const isPasswordValid = await compare(credentials.password, user.contrasena_hash);
              if (isPasswordValid) {
                await client.query('UPDATE usuarios SET activo = true WHERE id = $1', [user.id]);
                user.activo = true; // Actualizar el objeto de usuario en memoria
              } else {
                throw new Error("Email o contraseña incorrectos.");
              }
            } else {
              throw new Error("Esta cuenta ha sido desactivada.");
            }
          }

          if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
            const tiempoRestante = Math.ceil((new Date(user.bloqueado_hasta).getTime() - new Date().getTime()) / 60000);
            throw new Error(`Cuenta bloqueada. Inténtalo de nuevo en ${tiempoRestante} min.`);
          }

          if (credentials.twoFactorCode) {
            const twoFactorToken = user.token_2fa;
            const tokenExpires = user.token_2fa_expira;

            if (!twoFactorToken || !tokenExpires || new Date(tokenExpires) < new Date()) {
              throw new Error("El código ha expirado o es inválido. Intenta de nuevo.");
            }

            const codeIsValid = await compare(credentials.twoFactorCode, twoFactorToken);

            if (!codeIsValid) {
              throw new Error("Código de verificación incorrecto.");
            }
          } else {
            if (!credentials.password) {
                throw new Error("Contraseña es requerida.");
            }
            const isPasswordValid = await compare(credentials.password, user.contrasena_hash);

            if (!isPasswordValid) {
                const configRes = await client.query("SELECT clave, valor FROM configuracion WHERE clave IN ('max_intentos_login', 'tiempo_bloqueo_minutos');");
                const settings = configRes.rows.reduce((acc: any, row: any) => ({...acc, [row.clave]: parseInt(row.valor, 10)}), {});

                // --- CORRECCIÓN: Añadir validación y valores por defecto más robustos ---
                const MAX_ATTEMPTS = !isNaN(settings.max_intentos_login) ? settings.max_intentos_login : 5;
                const LOCKOUT_MINUTES = !isNaN(settings.tiempo_bloqueo_minutos) ? settings.tiempo_bloqueo_minutos : 15;

                const newAttemptCount = (user.intentos_login || 0) + 1;
                let errorMessage;

                if (newAttemptCount >= MAX_ATTEMPTS) {
                    const lockoutUntil = new Date(new Date().getTime() + LOCKOUT_MINUTES * 60000);
                    await client.query('UPDATE usuarios SET intentos_login = $1, bloqueado_hasta = $2 WHERE id = $3', [newAttemptCount, lockoutUntil, user.id]);
                    errorMessage = `Demasiados intentos fallidos. Tu cuenta ha sido bloqueada por ${LOCKOUT_MINUTES} minutos.`;
                } else {
                    await client.query('UPDATE usuarios SET intentos_login = $1 WHERE id = $2', [newAttemptCount, user.id]);
                    const intentosRestantes = MAX_ATTEMPTS - newAttemptCount;
                    errorMessage = `Contraseña incorrecta. Te ${intentosRestantes === 1 ? 'queda 1 intento' : `quedan ${intentosRestantes} intentos`}.`;
                }
                // Lanzar explícitamente el error con el mensaje construido
                throw new Error(errorMessage);
            }
            
            if (user.autenticacion_2fa) {
                const twoFactorCode = crypto.randomInt(100000, 999999).toString();
                const hashedToken = await hash(twoFactorCode, 10);
                const tokenExpiration = new Date(Date.now() + 600000); // 10 minutes

                await client.query("UPDATE usuarios SET token_2fa = $1, token_2fa_expira = $2 WHERE id = $3", [hashedToken, tokenExpiration, user.id]);
                
                const emailHtml = await render(TwoFactorAuthEmail({ validationCode: twoFactorCode }));
                await sendEmail({
                    to: user.email,
                    subject: "Tu código de verificación",
                    html: emailHtml,
                });
                throw new Error(`2FA_REQUIRED:${user.email}`);
            }
          }
          
          if (!credentials.twoFactorCode) {
             await client.query('UPDATE usuarios SET intentos_login = 0, bloqueado_hasta = NULL, ultimo_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
          } else {
             await client.query('UPDATE usuarios SET token_2fa = NULL, token_2fa_expira = NULL WHERE id = $1', [user.id]);
          }

          // Se añade 'autenticacion_2fa' al objeto que se devuelve
          return {
            id: user.id,
            name: user.nombre_usuario,
            fullName: user.nombre_completo,
            email: user.email,
            role: user.rol_nombre,
            image: user.foto_url,
            primer_login: user.primer_login,
            atleta_id: user.atleta_id, // <-- AÑADIDO para consistencia
            autenticacion_2fa: user.autenticacion_2fa, // <-- AÑADIDO
          };

        } catch (error) {
          throw error;
        } finally {
          client.release();
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.picture = user.image;
        token.fullName = user.fullName;
        token.primer_login = user.primer_login;
        token.atleta_id = user.atleta_id; // <-- AÑADIDO
        token.autenticacion_2fa = user.autenticacion_2fa; // <-- AÑADIDO
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = token.picture as string;
        session.user.fullName = token.fullName as string;
        session.user.primer_login = token.primer_login as boolean;
        session.user.atleta_id = token.atleta_id as string | undefined; // <-- AÑADIDO
        session.user.autenticacion_2fa = token.autenticacion_2fa as boolean; // <-- AÑADIDO
      }
      return session;
    }
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};