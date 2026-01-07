import { Html, Head, Preview, Body, Container, Section, Text, Hr } from '@react-email/components';
import * as React from 'react';

interface TwoFactorAuthEmailProps {
  validationCode: string;
}

export const TwoFactorAuthEmail = ({ validationCode }: TwoFactorAuthEmailProps) => (
  <Html>
    <Head />
    <Preview>Tu código de verificación</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section>
          <Text style={heading}>Tu Código de Verificación</Text>
          <Text style={paragraph}>
            Hola,
          </Text>
          <Text style={paragraph}>
            Usa el siguiente código para completar tu inicio de sesión. Este código es válido por 10 minutos.
          </Text>
          <Text style={codeBox}>
            {validationCode}
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Si no intentaste iniciar sesión, puedes ignorar este correo de forma segura.
          </Text>
          <Text style={footer}>Federación de Powerlifting - Sistema de Gestión</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default TwoFactorAuthEmail;

// --- Estilos para el correo ---
const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px', border: '1px solid #eee', borderRadius: '5px' };
const heading = { fontSize: '24px', fontWeight: 'bold', color: '#333' };
const paragraph = { fontSize: '16px', lineHeight: '1.5', color: '#555' };
const codeBox = { 
  backgroundColor: '#e9ecef', 
  padding: '15px', 
  borderRadius: '5px', 
  fontFamily: 'monospace',
  fontSize: '28px',
  fontWeight: 'bold',
  letterSpacing: '5px',
  textAlign: 'center' as const,
  color: '#333'
};
const hr = { borderColor: '#cccccc', margin: '20px 0' };
const footer = { fontSize: '12px', color: '#999999', marginTop: '20px' };
