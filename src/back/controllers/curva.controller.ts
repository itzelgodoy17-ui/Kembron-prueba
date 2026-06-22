import { NextResponse } from 'next/server';
import { ObraService } from '../services/obra.service';

const obraService = new ObraService();

export async function getCurvasObra(obraId: string) {
  try {
    if (!obraId) {
      return NextResponse.json({ error: 'Falta el ID de la obra' }, { status: 400 });
    }
    const data = await obraService.obtenerCurvasObra(obraId);
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Error al procesar las curvas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}