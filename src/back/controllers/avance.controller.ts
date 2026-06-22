import { NextRequest, NextResponse } from 'next/server';
import { ObraService } from '../services/obra.service';

const obraService = new ObraService();

export async function registrarAvance(req: NextRequest) {
  try {
    const body = await req.json();
    const avance = await obraService.registrarAvance(body);
    return NextResponse.json(avance, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al registrar avance' }, { status: 500 });
  }
}

export async function registrarGasto(req: NextRequest) {
  try {
    const body = await req.json();
    const gasto = await obraService.registrarGasto(body);
    return NextResponse.json(gasto, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al registrar gasto' }, { status: 500 });
  }
}

export async function guardarProgramacion(req: NextRequest) {
  try {
    const { itemId, semanas } = await req.json();
    const result = await obraService.guardarProgramacion(itemId, semanas);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar programación' }, { status: 500 });
  }
}