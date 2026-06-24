'use client';
import { useEffect, useState } from 'react';
import { obtenerToken } from '@/app/lib/auth';
import { 
  Calculator, 
  ArrowUpRight, 
  TrendingDown, 
  DollarSign, 
  Search,
  SlidersHorizontal 
} from 'lucide-react';

type ObraPresupuesto = {
  id: string;
  nombre: string;
  presupuestoTeorico: number;
  presupuestoReal: number;
  totalGastado: number;
  desvio: number;
};

export default function PresupuestoPage() {
  const [obras, setObras] = useState<ObraPresupuesto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarPresupuestos() {
      try {
        const res = await fetch('/api/obras', {
          headers: { Authorization: `Bearer ${obtenerToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setObras(Array.isArray(data) ? data : data.obras || []);
        }
      } catch (err) {
        console.error('Error al cargar presupuestos:', err);
      } finally {
        setCargando(false);
      }
    }
    cargarPresupuestos();
  }, []);

  const obrasFiltradas = obras.filter(o => 
    o.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm font-semibold text-slate-400 animate-pulse tracking-wide">
          Cargando estados presupuestarios...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Control de Presupuestos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Auditoría detallada de desvíos, modificaciones y partidas ejecutadas por proyecto.
          </p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar obra..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Proyecto / Obra</th>
                <th className="py-4 px-6">P. Teórico</th>
                <th className="py-4 px-6">P. Real (Modificado)</th>
                <th className="py-4 px-6">Total Ejecutado</th>
                <th className="py-4 px-6">Estado / Desvío</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {obrasFiltradas.length > 0 ? (
                obrasFiltradas.map((obra) => {
                  const desvioReal = obra.presupuestoReal - obra.totalGastado;
                  const estaExcedido = desvioReal < 0;
                  const porcentajeConsumo = obra.presupuestoReal > 0 
                    ? Math.min(100, (obra.totalGastado / obra.presupuestoReal) * 100) 
                    : 0;

                  return (
                    <tr key={obra.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span className="font-semibold text-gray-800 block tracking-tight">
                            {obra.nombre}
                          </span>
                          <div className="w-32 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${porcentajeConsumo}%` }}
                              className={`h-full ${estaExcedido ? 'bg-rose-500' : 'bg-blue-500'}`}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-medium text-gray-500">
                        ${(obra.presupuestoTeorico || 0).toLocaleString('es-AR')}
                      </td>

                      <td className="py-4 px-6 font-semibold text-gray-800">
                        ${(obra.presupuestoReal || 0).toLocaleString('es-AR')}
                      </td>

                      <td className="py-4 px-6 font-medium text-gray-700">
                        ${(obra.totalGastado || 0).toLocaleString('es-AR')}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${
                            estaExcedido 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {estaExcedido ? (
                              <>
                                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                Excedido
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                                Optimizado
                              </>
                            )}
                          </span>
                          <span className={`text-xs font-bold ${estaExcedido ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {estaExcedido ? '-' : '+'}${Math.abs(desvioReal).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-gray-400 font-medium">
                    No se encontraron registros de presupuestos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}