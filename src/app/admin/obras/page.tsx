'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { obtenerToken } from '../../lib/auth';

type Obra = {
  id: string;
  nombre: string;
  ubicacion: string;
  cliente: string;
  estado: string;
  activa: boolean;
  fechaInicio: string;
  fechaFinTeorica: string;
  presupuestoReal: number;
  totalGastado: number;
};

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function cargarObras() {
      const res = await fetch('/api/obras', {
        headers: { Authorization: `Bearer ${obtenerToken()}` },
      });
      const json = await res.json();
      setObras(json);
      setCargando(false);
    }
    cargarObras();
  }, []);

  const estadoColor: Record<string, string> = {
    EJECUCION: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    PAUSADA: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    FINALIZADA: 'bg-slate-100 text-slate-700 ring-slate-600/10',
  };

  const estadoLabel: Record<string, string> = {
    EJECUCION: 'En ejecución',
    PAUSADA: 'Pausada',
    FINALIZADA: 'Finalizada',
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm font-medium text-slate-400 animate-pulse">Cargando obras...</p>
      </div>
    );
  }

  const formatearFecha = (fecha: string) => {
    if (!fecha) return '—';
    const solo = fecha.split('T')[0];
    const [anio, mes, dia] = solo.split('-');
    return `${dia}/${mes}/${anio}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Obras</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión y control de proyectos activos.</p>
        </div>
        <button
          onClick={() => router.push('/admin/obras/nueva')}
          className="bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-sm font-medium text-sm flex items-center gap-1"
        >
          <span>+</span> Nueva obra
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {obras.map((obra) => (
          <div
            key={obra.id}
            className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            onClick={() => router.push(`/admin/obras/${obra.id}`)}
          >
            <div className="space-y-1 flex-1">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">{obra.nombre}</h2>
            <p className="text-sm text-slate-500 font-medium">
              {obra.cliente} <span className="text-slate-300">·</span> {obra.ubicacion}
            </p>
            <div className="text-xs text-slate-400 font-medium pt-1">
              {formatearFecha(obra.fechaInicio)} — {formatearFecha(obra.fechaFinTeorica)}
            </div>
          
            {obra.presupuestoReal > 0 && (
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Ejecución económica</span>
                  <span>{Math.min(100, Math.round((obra.totalGastado / obra.presupuestoReal) * 100))}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-1.5 bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (obra.totalGastado / obra.presupuestoReal) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

            <div className="flex gap-2 items-center self-start md:self-center">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ring-1 ${estadoColor[obra.estado]}`}>
                {estadoLabel[obra.estado]}
              </span>
              {!obra.activa && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-600/10">
                  Inactiva
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}