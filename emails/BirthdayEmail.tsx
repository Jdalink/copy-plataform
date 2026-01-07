import { Html, Head, Preview, Body, Container, Section, Text, Heading, Hr, Img } from '@react-email/components';
import * as React from 'react';

interface BirthdayEmailProps {
  userName: string;
  motivationalPhrase: string;
}

export const BirthdayEmail = ({ userName, motivationalPhrase }: BirthdayEmailProps) => (
  <Html>
    <Head />
    <Preview>¡Feliz Cumpleaños de parte de la Federación!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ textAlign: 'center' }}>
          <Img src="https://i.imgur.com/o14b5o2.png" width="80" height="80" alt="Dumbbell Icon" style={{ margin: '0 auto' }} />
          <Heading style={heading}>¡Feliz Cumpleaños, {userName}!</Heading>
          <Text style={paragraph}>
            Toda la Federación de Levantamiento de Potencia de Guatemala te desea un día extraordinario, lleno de fuerza y nuevos récords personales.
          </Text>
          <Text style={phraseBox}>
            "{motivationalPhrase}"
          </Text>
          <Text style={paragraph}>
            ¡Que la fuerza te acompañe en este nuevo año de vida!
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Federación de Potencia - Sistema de Gestión</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default BirthdayEmail;

// --- Styles ---
const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 20px', border: '1px solid #eee', borderRadius: '5px' };
const heading = { fontSize: '28px', fontWeight: 'bold', color: '#333' };
const paragraph = { fontSize: '16px', lineHeight: '1.5', color: '#555' };
const phraseBox = {
  backgroundColor: '#f0f0f0',
  padding: '15px',
  borderRadius: '5px',
  fontSize: '16px',
  fontStyle: 'italic',
  color: '#333',
  margin: '20px 0'
};
const hr = { borderColor: '#cccccc', margin: '30px 0' };
const footer = { fontSize: '12px', color: '#999999', marginTop: '20px' };