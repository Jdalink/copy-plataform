import { Html, Head, Preview, Body, Container, Section, Text, Link, Hr, Heading } from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  user: {
    nombre_usuario: string;
    nombre_completo: string;
  };
  password?: string;
  activationUrl: string;
}

export const WelcomeEmail = ({ user, password, activationUrl }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Activa tu cuenta y accede a tus credenciales.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section>
          <Heading style={heading}>¡Un último paso para empezar!</Heading>
          <Text style={paragraph}>Hola, {user.nombre_completo || user.nombre_usuario},</Text>
          <Text style={paragraph}>
            Gracias por registrarte. Para completar tu registro y asegurar tu cuenta, por favor haz clic en el botón de abajo para activarla.
          </Text>

          <Link style={button} href={activationUrl}>
            Acceder Cuenta
          </Link>

          <Text style={paragraph}>
            Este enlace de activación es válido por 24 horas.
          </Text>
          
          <Hr style={hr} />
          
          <Heading style={subHeading}>Tus Credenciales de Acceso</Heading>
          <Text style={paragraph}>
            Una vez activada tu cuenta, podrás iniciar sesión con las siguientes credenciales:
          </Text>
          <Text style={credentialText}>
            <strong>Usuario:</strong> {user.nombre_usuario}
          </Text>
          {password && (
            <Text style={credentialText}>
              <strong>Contraseña Temporal:</strong> {password}
            </Text>
          )}
          <Text style={paragraph}>
            Te recomendamos cambiar tu contraseña después de tu primer inicio de sesión.
          </Text>
          
          <Hr style={hr} />

          <Text style={footer}>
            Si no te registraste en nuestra plataforma, por favor ignora este correo.
            <br />
            Federación de Powerlifting - Sistema de Gestión
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

// --- Estilos para el correo ---
const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px', border: '1px solid #eee', borderRadius: '5px' };
const heading = { fontSize: '24px', fontWeight: 'bold', color: '#333', textAlign: 'center' as const };
const subHeading = { fontSize: '18px', fontWeight: 'bold', color: '#444', marginTop: '20px' };
const paragraph = { fontSize: '16px', lineHeight: '1.5', color: '#555' };
const credentialText = { ...paragraph, paddingLeft: '15px', borderLeft: '3px solid #eee', margin: '10px 0' };
const button = { backgroundColor: '#007bff', color: '#ffffff', padding: '12px 20px', borderRadius: '5px', textDecoration: 'none', display: 'inline-block', textAlign: 'center' as const, width: '100%' };
const hr = { borderColor: '#cccccc', margin: '20px 0' };
const footer = { fontSize: '12px', color: '#999999', marginTop: '20px', textAlign: 'center' as const };