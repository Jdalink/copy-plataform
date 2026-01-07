import { Html, Head, Preview, Body, Container, Section, Text, Link, Hr } from '@react-email/components';
import * as React from 'react';

interface NewUserCredentialsEmailProps {
  userName: string;
  userEmail: string;
  password_generado: string;
  loginUrl: string;
}

export const NewUserCredentialsEmail = ({ userName, userEmail, password_generado, loginUrl }: NewUserCredentialsEmailProps) => (
  <Html>
    <Head />
    <Preview>Bienvenido al Sistema de la Federación de Potencia</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section>
          <Text style={heading}>¡Bienvenido a la Federación Nacional de Levantamiento de Potencia!</Text>
          <Text style={paragraph}>Hola {userName},</Text>
          <Text style={paragraph}>
            Se ha creado una cuenta para ti en el Sistema de Gestión de la Federación de Potencia.
            Ya puedes acceder a la plataforma para ver tu información, planes de entrenamiento y más.
          </Text>
          <Text style={paragraph}>Aquí están tus credenciales de acceso:</Text>
          <Text style={{ ...paragraph, ...codeBox }}>
            <strong>Usuario:</strong> {userEmail}<br />
            <strong>Contraseña Temporal:</strong> {password_generado}
          </Text>
          <Text style={paragraph}>
            Por tu seguridad, te recomendamos encarecidamente que cambies tu contraseña después de iniciar sesión por primera vez.
          </Text>
          <Link style={button} href={loginUrl}>
            Acceder a la cuenta
          </Link>
          <Hr style={hr} />
          <Text style={footer}>Federación Nacional de Levantamiento de Potencia - Sistema de Gestión</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default NewUserCredentialsEmail;

// --- Estilos para el correo ---
const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px', border: '1px solid #eee', borderRadius: '5px' };
const heading = { fontSize: '24px', fontWeight: 'bold', color: '#333' };
const paragraph = { fontSize: '16px', lineHeight: '1.5', color: '#555' };
const button = { backgroundColor: '#28a745', color: '#ffffff', padding: '12px 20px', borderRadius: '5px', textDecoration: 'none', display: 'inline-block' };
const codeBox = { backgroundColor: '#e9ecef', padding: '10px', borderRadius: '5px', fontFamily: 'monospace' };
const hr = { borderColor: '#cccccc', margin: '20px 0' };
const footer = { fontSize: '12px', color: '#999999', marginTop: '20px' };
