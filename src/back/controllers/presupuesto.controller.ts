import { NextRequest, NextResponse } from 'next/server';
import { ObraService } from '../services/obra.service';

const obraService = new ObraService();

export async function crearTitulo(req: NextRequest) {
  try {
    const { obraId, nombre } = await req.json();
    const titulo = await obraService.crearTitulo(obraId, nombre);
    return NextResponse.json(titulo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear título' }, { status: 500 });
  }
}

export async function crearItem(req: NextRequest) {
  try {
    const body = await req.json();
    const item = await obraService.crearItem(body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear ítem' }, { status: 500 });
  }
}

export async function crearAdicionalDeductivo(req: NextRequest) {
  try {
    const body = await req.json();
    const adicional = await obraService.crearAdicionalDeductivo(body);
    return NextResponse.json(adicional, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear adicional/deductivo' }, { status: 500 });
  }
}