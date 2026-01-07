import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // 1. Validar que el usuario sea un atleta y tenga un ID de atleta.
  if (session?.user?.role !== 'Atleta' || !session.user.atleta_id) {
    return NextResponse.json({ error: 'No autorizado o ID de atleta no encontrado' }, { status: 403 });
  }

  const atletaId = session.user.atleta_id;

  try {
    const client = await pool.connect();

    // 2. Obtener la información de categoría y sexo del atleta.
    const atletaQuery = await client.query(
      'SELECT categoria_peso, sexo FROM atletas WHERE id = $1',
      [atletaId]
    );

    if (atletaQuery.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Atleta no encontrado' }, { status: 404 });
    }

    const { categoria_peso, sexo } = atletaQuery.rows[0];

    // 3. Buscar competencias programadas que tengan categorías que coincidan.
    //    Usamos DISTINCT para no mostrar la misma competencia varias veces si coincide en múltiples categorías.
    const competenciasQuery = await client.query(`
      SELECT DISTINCT c.id, c.nombre, c.fecha
      FROM competencias c
      JOIN competencia_categorias cc ON c.id = cc.competencia_id
      WHERE c.estado = 'programada' AND cc.categoria_peso = $1 AND cc.sexo = $2
      ORDER BY c.fecha ASC
      LIMIT 5;
    `, [categoria_peso, sexo]);

    client.release();
    return NextResponse.json(competenciasQuery.rows);
  } catch (error) {
    console.error('Error al obtener próximas competencias para el atleta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}