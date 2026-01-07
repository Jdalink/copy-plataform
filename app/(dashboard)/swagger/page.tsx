// app/(dashboard)/swagger/page.tsx
'use client';

import 'swagger-ui-react/swagger-ui.css';
import dynamic from 'next/dynamic';

// Importa SwaggerUI de forma dinámica y deshabilita el renderizado en servidor (SSR)
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
});

// Un componente de carga simple para mostrar mientras se carga el SwaggerUI
function Loading() {
  return <p>Loading Swagger UI...</p>;
}

function SwaggerPage() {
  // La URL debe apuntar a la ruta de tu API que sirve la especificación OpenAPI
  // Crearemos esta ruta en el siguiente paso.
  return <SwaggerUI url="/api/doc" />;
}

export default SwaggerPage;