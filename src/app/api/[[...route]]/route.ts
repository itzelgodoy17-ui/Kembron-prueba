import { NextRequest, NextResponse } from 'next/server';
import { getDashboardGlobal } from '../../../back/controllers/dashboard.controller';

async function handleRequest(req: NextRequest) {
  const url = req.nextUrl.pathname;
  const method = req.method;

  if (url === '/api/dashboard' && method === 'GET') {
    return getDashboardGlobal();
  }

  return NextResponse.json({ error: `Ruta ${url} no encontrada` }, { status: 404 });
}

export { handleRequest as GET, handleRequest as POST, handleRequest as PUT, handleRequest as DELETE };