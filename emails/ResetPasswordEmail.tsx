import { Html, Head, Preview, Body, Container, Section, Text, Link, Hr } from '@react-email/components';
import * as React from 'react';

interface ResetPasswordEmailProps {
  userEmail: string;
  resetLink: string;
}

export const ResetPasswordEmail = ({ userEmail, resetLink }: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Recupera tu contraseña de la Federación de Powerlifting</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section>
          <Text style={heading}>Recupera tu contraseña</Text>
          <Text style={paragraph}>Hola,</Text>
          <Text style={paragraph}>
            Recibimos una solicitud para restablecer la contraseña de tu cuenta ({userEmail}). Si no hiciste esta solicitud, puedes ignorar este correo.
          </Text>
          <Text style={paragraph}>
            Para continuar, haz clic en el siguiente enlace. Este enlace es válido por 1 hora.
          </Text>
          <Link style={button} href={resetLink}>
            Restablecer Contraseña
          </Link>
          <Hr style={hr} />
          <Text style={paragraph}>
            Si el botón no funciona, copia y pega la siguiente URL en tu navegador:
          </Text>
          <Text style={link}>{resetLink}</Text>
          <Text style={footer}>Federación de Powerlifting - Sistema de Gestión</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ResetPasswordEmail;

// --- Estilos para el correo ---
const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px', border: '1px solid #eee', borderRadius: '5px' };
const heading = { fontSize: '24px', fontWeight: 'bold', color: '#333' };
const paragraph = { fontSize: '16px', lineHeight: '1.5', color: '#555' };
const button = { backgroundColor: '#007bff', color: '#ffffff', padding: '12px 20px', borderRadius: '5px', textDecoration: 'none', display: 'inline-block' };
const link = { color: '#007bff', textDecoration: 'underline', wordBreak: 'break-all' as const };
const hr = { borderColor: '#cccccc', margin: '20px 0' };
const footer = { fontSize: '12px', color: '#999999', marginTop: '20px' };