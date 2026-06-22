import { NextRequest, NextResponse } from 'next/server';
import { ObraService } from '../services/obra.service';

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

export async function asignarObra(req: NextRequest) {
  try {
    const { usuarioId, obraId } = await req.json();
    const result = await obraService.asignarObraASupervisor(usuarioId, obraId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al asignar obra' }, { status: 500 });
  }
}