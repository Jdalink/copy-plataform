import { Pool } from 'pg';

let pool: Pool;

// Verificamos si estamos en un entorno de producción (dentro de Docker)
if (process.env.NODE_ENV === 'production') {
  // En producción, creamos una única instancia de la Pool.
  // El script 'entrypoint.sh' ya se encargó de poner las credenciales
  // en las variables de entorno (process.env).
  pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: process.env.PGSSLMODE !== 'disable',
  });
} else {
  // Esta sección es para desarrollo local (cuando no usas Docker)
  // Ayuda a evitar crear múltiples conexiones durante el 'hot-reloading'
  // @ts-ignore
  if (!global._dbPool) {
    // @ts-ignore
    global._dbPool = new Pool(); // Aquí tomaría las variables de un .env.local
  }
  // @ts-ignore
  pool = global._dbPool;
}

export { pool };