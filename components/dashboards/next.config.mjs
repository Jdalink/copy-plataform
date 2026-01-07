/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // Asegura que los modelos de IA de Google (Gemini) estén permitidos
        // para las API Routes. Esto previene posibles errores de "modelo no permitido".
        serverComponentsExternalPackages: ['@google/generative-ai'],
    },
};

export default nextConfig;