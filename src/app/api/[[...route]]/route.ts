import { NextRequest, NextResponse } from 'next/server';
import { getDashboardGlobal } from '@/back/controllers/dashboard.controller';
import { getCurvasObra } from '@/back/controllers/curva.controller';
import { loginController } from '@/back/controllers/auth.controller';
import { getObras, crearObra, editarObra, desactivarObra, getObraDetalle, getAvancesObra, getGastosObra } from '@/back/controllers/obra.controller';import { crearTitulo, crearItem, crearAdicionalDeductivo } from '@/back/controllers/presupuesto.controller';
import { registrarAvance, registrarGasto, guardarProgramacion } from '@/back/controllers/avance.controller';
import { getUsuarios, crearUsuario, editarUsuario, eliminarUsuario, asignarObra } from '@/back/controllers/usuario.controller';

async function handleRequest(req: NextRequest) {
  const url = req.nextUrl.pathname;
  const method = req.method;
  const segments = url.split('/').filter(Boolean); 

  if (url === '/api/auth/login' && method === 'POST') {
    return await loginController(req as unknown as Request);
  }

  if (url === '/api/dashboard' && method === 'GET') {
    return getDashboardGlobal();
  }

  if (url.startsWith('/api/curvas') && method === 'GET') {
    const { searchParams } = req.nextUrl;
    const obraId = searchParams.get('obraId') || '';
    return getCurvasObra(obraId);
  }

  if (url === '/api/obras' && method === 'GET') {
    return getObras();
  }
  if (url === '/api/obras' && method === 'POST') {
    return crearObra(req);
  }
  if (url.match(/^\/api\/obras\/[^/]+$/) && method === 'PUT') {
    const id = segments[2];
    return editarObra(req, id);
  }
  if (url.match(/^\/api\/obras\/[^/]+\/desactivar$/) && method === 'PATCH') {
    const id = segments[2];
    return desactivarObra(id);
  }

  if (url === '/api/titulos' && method === 'POST') {
    return crearTitulo(req);
  }
  if (url === '/api/items' && method === 'POST') {
    return crearItem(req);
  }
  if (url === '/api/adicionales' && method === 'POST') {
    return crearAdicionalDeductivo(req);
  }

  if (url === '/api/avance' && method === 'POST') {
    return registrarAvance(req);
  }
  if (url === '/api/gastos' && method === 'POST') {
    return registrarGasto(req);
  }
  if (url === '/api/programacion' && method === 'POST') {
    return guardarProgramacion(req);
  }

  if (url === '/api/usuarios' && method === 'GET') {
    return getUsuarios();
  }
  if (url === '/api/usuarios' && method === 'POST') {
    return crearUsuario(req);
  }
  if (url.match(/^\/api\/usuarios\/[^/]+$/) && method === 'PUT') {
    const id = segments[2];
    return editarUsuario(req, id);
  }
  if (url.match(/^\/api\/usuarios\/[^/]+$/) && method === 'DELETE') {
    const id = segments[2];
    return eliminarUsuario(id);
  }
  if (url === '/api/usuarios/asignar-obra' && method === 'POST') {
    return asignarObra(req);
  }
  if (url.match(/^\/api\/obras\/[^/]+$/) && method === 'GET') {
  const id = segments[2];
  return getObraDetalle(id);
  }
  if (url.match(/^\/api\/obras\/[^/]+\/avances$/) && method === 'GET') {
    const id = segments[2];
    return getAvancesObra(id);
  }
  if (url.match(/^\/api\/obras\/[^/]+\/gastos$/) && method === 'GET') {
    const id = segments[2];
    return getGastosObra(id);
  }

  return NextResponse.json({ error: `Ruta ${url} no encontrada` }, { status: 404 });
}

export { handleRequest as GET, handleRequest as POST, handleRequest as PUT, handleRequest as PATCH, handleRequest as DELETE };