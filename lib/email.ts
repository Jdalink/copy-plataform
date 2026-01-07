import nodemailer from 'nodemailer';
import fs from 'fs';
import { pool } from './db';

// Helper para leer secrets de Docker de forma segura
const readSecret = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  try {
    // Lee el contenido del archivo especificado por la variable de entorno
    return fs.readFileSync(path, 'utf8').trim();
  } catch (e) {
    // Si el archivo no existe (ej. en desarrollo local), no es un error crítico.
    return undefined;
  }
};

// Leer credenciales desde los archivos de secrets o, como fallback, desde variables de entorno directas.
const smtpUser = readSecret(process.env.SMTP_USER_FILE) || process.env.SMTP_USER;
const brevoApiKey = readSecret(process.env.BREVO_API_KEY_FILE) || process.env.BREVO_API_KEY;
const fromEmail = readSecret(process.env.SMTP_FROM_FILE) || process.env.SMTP_FROM || 'PowerFed System <noreply@example.com>';

// Configurar el transportador de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  auth: {
    user: smtpUser,
    pass: brevoApiKey, // Brevo (Sendinblue) usa la API Key como contraseña
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  // 1. Verificar si las notificaciones por correo están habilitadas en la base de datos.
  // Esto actúa como un interruptor maestro para todos los correos.
  const client = await pool.connect();
  try {
    const configResult = await client.query("SELECT valor FROM configuracion WHERE clave = 'notificaciones_email'");
    const emailNotificationsEnabled = configResult.rows[0]?.valor === 'true';

    if (!emailNotificationsEnabled) {
      console.log(`INFO: El envío de correo a ${options.to} fue bloqueado porque las notificaciones por email están desactivadas en la configuración.`);
      // Se devuelve un éxito silencioso para no romper los flujos que llaman a esta función.
      return { success: true, message: 'Emails deshabilitados por configuración.' };
    }

  // 2. Verificar que las credenciales de correo electrónico están configuradas.
  if (!smtpUser || !brevoApiKey) {
    console.error("Faltan credenciales de SMTP (usuario o clave de API). El correo no se puede enviar.");
    throw new Error("El servicio de correo no está configurado correctamente en el servidor.");
  }

    // 3. Si todo está en orden, proceder a enviar el correo.
    const mailOptions = {
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email enviado exitosamente a ${options.to} con ID: ${info.messageId}`);
    return info;

  } catch (error) {
    console.error("Fallo al enviar email:", error);
    // Lanzar un error genérico para no exponer detalles de la configuración.
    throw new Error("Error al intentar enviar el correo.");
  } finally {
    client.release();
  }
}