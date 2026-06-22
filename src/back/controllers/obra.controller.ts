import { NextRequest, NextResponse } from 'next/server';
import { ObraService } from '../services/obra.service';

const obraService = new ObraService();

export async function getObras() {
  try {
    const obras = await obraService.obtenerTodasLasObras();
    return NextResponse.json(obras, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener obras' }, { status: 500 });
  }
}

export async function crearObra(req: NextRequest) {
  try {
    const body = await req.json();
    const obra = await obraService.crearObra(body);
    return NextResponse.json(obra, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear obra' }, { status: 500 });
  }
}

export async function editarObra(req: NextRequest, id: string) {
  try {
    const body = await req.json();
    const obra = await obraService.editarObra(id, body);
    return NextResponse.json(obra, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al editar obra' }, { status: 500 });
  }
}

export async function desactivarObra(id: string) {
  try {
    const obra = await obraService.desactivarObra(id);
    return NextResponse.json(obra, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al desactivar obra' }, { status: 500 });
  }
}

export async function getObraDetalle(id: string) {
  try {
    const obra = await obraService.obtenerObraDetalle(id);
    if (!obra) return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 });
    return NextResponse.json(obra, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener obra' }, { status: 500 });
  }
}

export async function getAvancesObra(id: string) {
  try {
    const avances = await obraService.obtenerAvancesObra(id);
    return NextResponse.json(avances, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener avances' }, { status: 500 });
  }
}

export async function getGastosObra(id: string) {
  try {
    const gastos = await obraService.obtenerGastosObra(id);
    return NextResponse.json(gastos, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener gastos' }, { status: 500 });
  }
}