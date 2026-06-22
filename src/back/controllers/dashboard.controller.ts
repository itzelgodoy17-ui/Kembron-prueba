import { NextResponse } from 'next/server';
import { ObraService } from '../services/obra.service';

const obraService = new ObraService();

export async function getDashboardGlobal() {
  try {
    const data = await obraService.obtenerDashboardGlobal();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al calcular los datos de control' }, { status: 500 });
  }
}