import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_super_segura_123';

const RUTAS_PUBLICAS = ['/api/auth/login'];

export function verificarToken(req: NextRequest): { id: string; email: string; rol: string; nombre: string } | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; rol: string; nombre: string };
  } catch {
    return null;
  }
}

export function esRutaPublica(url: string): boolean {
  return RUTAS_PUBLICAS.includes(url);
}

export function soloAdmin(usuario: { rol: string } | null): boolean {
  return usuario?.rol === 'ADMIN';
}