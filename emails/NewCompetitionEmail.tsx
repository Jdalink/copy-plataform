import { Html, Head, Preview, Body, Container, Section, Text, Heading, Link, Hr } from '@react-email/components';
import * as React from 'react';

interface NewCompetitionEmailProps {
  userName: string;
  competitionName: string;
  competitionDate: string;
  competitionLocation: string;
}

export const NewCompetitionEmail = ({ userName, competitionName, competitionDate, competitionLocation }: NewCompetitionEmailProps) => (
  <Html>
    <Head />
    <Preview>¡Nueva Competencia Anunciada!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section>
          <Heading style={heading}>¡Nueva Competencia Anunciada!</Heading>
          <Text style={paragraph}>Hola {userName},</Text>
          <Text style={paragraph}>
            Te informamos que se ha abierto una nueva competencia en la que podrías ser elegible para participar.
          </Text>
          <Hr style={hr} />
          <Text style={{ ...paragraph, ...detailBox }}>
            <strong>Competencia:</strong> {competitionName}<br />
            <strong>Fecha:</strong> {new Date(competitionDate).toLocaleDateString()}<br />
            <strong>Lugar:</strong> {competitionLocation}
          </Text>
          <Hr style={hr} />
          <Text style={paragraph}>
            Visita la plataforma para ver más detalles y considerar tu inscripción.
          </Text>
          <Link style={button} href={`${process.env.NEXTAUTH_URL}/competencias`}>
            Ver Competencias
          </Link>
          <Text style={footer}>Federación de Powerlifting - Sistema de Gestión</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default NewCompetitionEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px', border: '1px solid #eee', borderRadius: '5px' };
const heading = { fontSize: '24px', fontWeight: 'bold', color: '#333' };
const paragraph = { fontSize: '16px', lineHeight: '1.5', color: '#555' };
const detailBox = { backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '5px' };
const button = { backgroundColor: '#007bff', color: '#ffffff', padding: '12px 20px', borderRadius: '5px', textDecoration: 'none', display: 'block', textAlign: 'center' as const };
const hr = { borderColor: '#cccccc', margin: '20px 0' };
const footer = { fontSize: '12px', color: '#999999', marginTop: '20px' };