import { NextRequest, NextResponse } from 'next/server';
import { ObraService } from '../services/obra.service';
import { prisma } from '../config/prisma';
import { verificarToken } from '../middleware/auth.middleware'; 

const obraService = new ObraService();

export async function registrarAvance(req: NextRequest) {
  try {
    const body = await req.json();
    const avance = await obraService.registrarAvance(body);
    return NextResponse.json(avance, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al registrar avance' }, 
      { status: 400 } 
    );
  }
}

export async function registrarGasto(req: NextRequest) {
  try {
    const usuarioAutenticado = verificarToken(req);

    if (!usuarioAutenticado) {
      return NextResponse.json(
        { error: 'No autorizado. Token inválido o ausente.' }, 
        { status: 401 }
      );
    }

    const body = await req.json();

    const gastoCreado = await prisma.gasto.create({
      data: {
        itemId: body.itemId,
        descripcion: body.descripcion || '',
        categoria: body.categoria,
        monto: Number(body.monto) || 0,
        fecha: body.fecha ? new Date(body.fecha) : new Date(),
        usuarioId: usuarioAutenticado.id, 
      }
    });

    return NextResponse.json(gastoCreado, { status: 201 });
  } catch (error: any) {
    console.error("Error en registrarGasto:", error);
    return NextResponse.json(
      { error: 'Error al registrar el gasto', detalle: error.message }, 
      { status: 500 }
    );
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

export async function getProgramacionObra(obraId: string) {
  try {
    const { ObraService } = await import('../services/obra.service');
    const data = await new ObraService().obtenerProgramacionObra(obraId);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener programación' }, { status: 500 });
  }
}