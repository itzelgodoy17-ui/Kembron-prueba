import { NextRequest, NextResponse } from 'next/server';
import { getDashboardGlobal } from '@/back/controllers/dashboard.controller';
import { getCurvasObra } from '@/back/controllers/curva.controller';
import { loginController } from '@/back/controllers/auth.controller';
import { getObras, crearObra, editarObra, desactivarObra, getObraDetalle, getAvancesObra, getGastosObra, getResumenObra, activarObra } from '@/back/controllers/obra.controller';import { crearTitulo, crearItem, crearAdicionalDeductivo, editarItem, editarTitulo, eliminarItem, eliminarTitulo } from '@/back/controllers/presupuesto.controller';
import { registrarAvance, registrarGasto, guardarProgramacion, getProgramacionObra } from '@/back/controllers/avance.controller';
import { getUsuarios, crearUsuario, editarUsuario, eliminarUsuario, asignarObra } from '@/back/controllers/usuario.controller';
import { esRutaPublica, soloAdmin, verificarToken } from '@/back/middleware/auth.middleware';

const RUTAS_SOLO_ADMIN = [
  '/api/dashboard',
  '/api/usuarios',
  '/api/titulos',
  '/api/items',
  '/api/adicionales',
  '/api/programacion',
];

async function handleRequest(req: NextRequest) {
  const url = req.nextUrl.pathname;
  const method = req.method;
  const segments = url.split('/').filter(Boolean); 

  if (esRutaPublica(url) && method === 'POST') {
    return await loginController(req as unknown as Request);
  }

  const usuario = verificarToken(req);
  if (!usuario) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const esRutaAdmin = RUTAS_SOLO_ADMIN.some(ruta => url.startsWith(ruta)) ||
    (url.match(/^\/api\/obras\/[^/]+\/desactivar$/) && method === 'PATCH');

  if (esRutaAdmin && !soloAdmin(usuario)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
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
    if (usuario.rol === 'SUPERVISOR') {
      const { ObraService } = await import('@/back/services/obra.service');
      const obras = await new ObraService().obtenerObrasDeUsuario(usuario.id);
      return NextResponse.json(obras, { status: 200 });
    }
    return getObras();
  }
  if (url === '/api/obras' && method === 'POST') {const body = await req.json();return crearObra(req, body);}
  if (url.match(/^\/api\/obras\/[^/]+\/resumen$/) && method === 'GET') return getResumenObra(segments[2]);
  if (url.match(/^\/api\/obras\/[^/]+$/) && method === 'GET') return getObraDetalle(segments[2]);
  if (url.match(/^\/api\/obras\/[^/]+$/) && method === 'PUT') {const body = await req.json(); return editarObra(req, segments[2], body);}
  if (url.match(/^\/api\/obras\/[^/]+\/desactivar$/) && method === 'PATCH') return desactivarObra(segments[2]);
  if (url.match(/^\/api\/obras\/[^/]+\/activar$/) && method === 'PATCH') return activarObra(segments[2]);
  if (url.match(/^\/api\/obras\/[^/]+\/avances$/) && method === 'GET') return getAvancesObra(segments[2]);
  if (url.match(/^\/api\/obras\/[^/]+\/gastos$/) && method === 'GET') return getGastosObra(segments[2]);
  if (url.match(/^\/api\/obras\/[^/]+\/programacion$/) && method === 'GET') return getProgramacionObra(segments[2]);
  if (url.match(/^\/api\/obras\/[^/]+\/detalle$/) && method === 'GET') return getObraDetalle(segments[2]);


  if (url === '/api/titulos' && method === 'POST') return crearTitulo(req);
  if (url === '/api/items' && method === 'POST') return crearItem(req);
  if (url === '/api/adicionales' && method === 'POST') return crearAdicionalDeductivo(req);


  if (url === '/api/avance' && method === 'POST') return registrarAvance(req);
  if (url === '/api/gastos' && method === 'POST') return registrarGasto(req);
  if (url === '/api/programacion' && method === 'POST') return guardarProgramacion(req);

  
  if (url === '/api/usuarios' && method === 'GET') return getUsuarios();
  if (url === '/api/usuarios' && method === 'POST') return crearUsuario(req);
  if (url === '/api/usuarios/asignar-obra' && method === 'POST') return asignarObra(req);
  if (url.match(/^\/api\/usuarios\/[^/]+$/) && method === 'PUT') return editarUsuario(req, segments[2]);
  if (url.match(/^\/api\/usuarios\/[^/]+$/) && method === 'DELETE') return eliminarUsuario(segments[2]);

  if (url.match(/^\/api\/titulos\/[^/]+$/) && method === 'PUT') return editarTitulo(req, segments[2]);
  if (url.match(/^\/api\/titulos\/[^/]+$/) && method === 'DELETE') return eliminarTitulo(segments[2]);
  
  if (url.match(/^\/api\/items\/[^/]+$/) && method === 'PUT') return editarItem(req, segments[2]);
  if (url.match(/^\/api\/items\/[^/]+$/) && method === 'DELETE') return eliminarItem(segments[2]);

  return NextResponse.json({ error: `Ruta ${url} no encontrada` }, { status: 404 });
}

export { handleRequest as GET, handleRequest as POST, handleRequest as PUT, handleRequest as PATCH, handleRequest as DELETE };