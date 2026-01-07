import { Html, Head, Preview, Body, Container, Section, Text, Heading, Link, Hr } from '@react-email/components';
import * as React from 'react';

interface InscriptionRequestEmailProps {
  coachName: string;
  athleteName: string;
  competitionName: string;
}

export const InscriptionRequestEmail = ({ coachName, athleteName, competitionName }: InscriptionRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>Solicitud de Inscripción Pendiente</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section>
          <Heading style={heading}>Solicitud de Inscripción Pendiente</Heading>
          <Text style={paragraph}>Hola {coachName},</Text>
          <Text style={paragraph}>
            Tu atleta <strong>{athleteName}</strong> ha solicitado inscribirse en la siguiente competencia y requiere tu aprobación:
          </Text>
          <Text style={competitionBox}>
            {competitionName}
          </Text>
          <Text style={paragraph}>
            Por favor, ingresa a la plataforma para revisar, aprobar o rechazar esta solicitud.
          </Text>
          <Link style={button} href={`${process.env.NEXTAUTH_URL}/`}>
            Ir a mi Dashboard
          </Link>
          <Hr style={hr} />
          <Text style={footer}>Federación de Powerlifting - Sistema de Gestión</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default InscriptionRequestEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px', border: '1px solid #eee', borderRadius: '5px' };
const heading = { fontSize: '24px', fontWeight: 'bold', color: '#333' };
const paragraph = { fontSize: '16px', lineHeight: '1.5', color: '#555' };
const competitionBox = { fontSize: '18px', fontWeight: 'bold', textAlign: 'center' as const, margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' };
const button = { backgroundColor: '#28a745', color: '#ffffff', padding: '12px 20px', borderRadius: '5px', textDecoration: 'none', display: 'block', textAlign: 'center' as const };
const hr = { borderColor: '#cccccc', margin: '20px 0' };
const footer = { fontSize: '12px', color: '#999999', marginTop: '20px' };