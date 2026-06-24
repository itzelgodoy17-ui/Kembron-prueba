import { NextRequest, NextResponse } from 'next/server';
import { ObraService } from '../services/obra.service';
import { prisma } from '../config/prisma';

const obraService = new ObraService();

export async function getUsuarios() {
  try {
    const usuarios = await obraService.obtenerUsuarios();
    return NextResponse.json(usuarios, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function crearUsuario(req: NextRequest) {
  try {
    const body = await req.json();
    const usuario = await obraService.crearUsuario(body);
    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}

export async function editarUsuario(req: NextRequest, id: string) {
  try {
    const body = await req.json();
    const usuario = await obraService.editarUsuario(id, body);
    return NextResponse.json(usuario, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al editar usuario' }, { status: 500 });
  }
}

export async function eliminarUsuario(id: string) {
  try {
    await obraService.eliminarUsuario(id);
    return NextResponse.json({ mensaje: 'Usuario eliminado' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}

export async function asignarObra(req: Request) {
  try {
    const { usuarioId, obraId } = await req.json();

    if (!usuarioId || !obraId) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios (usuarioId u obraId).' },
        { status: 400 }
      );
    }

    const asignacion = await obraService.asignarObraASupervisor(usuarioId, obraId);

    return NextResponse.json(
      { message: 'Obra asignada correctamente.', asignacion },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error capturado en asignarObra:', error);

    if (error.message === 'Este supervisor ya tiene esa obra asignada' || error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El supervisor ya tiene esta obra asignada actualmente.' },
        { status: 409 } 
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno al asignar la obra.' },
      { status: 500 }
    );
  }
}