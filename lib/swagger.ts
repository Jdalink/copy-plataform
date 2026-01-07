// lib/swagger.ts
import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de PowerFed - Sistema de Gestión',
      version: '1.0.0',
      description: 'Documentación completa de la API para la plataforma de gestión de la federación de powerlifting.',
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    security: [{
        bearerAuth: [],
    }],
  },
  apis: ['./app/api/**/*.ts'], // Apunta a tus archivos de rutas de la API
};

export const swaggerSpec = swaggerJSDoc(options);