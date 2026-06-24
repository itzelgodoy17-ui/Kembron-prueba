'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obtenerToken } from '../../../lib/auth';
import TabPresupuesto from './components/TabPresupuesto';
import TabAvance from './components/TabAvance';
import TabGantt from './components/TabGantt';
import CurvasS from './components/CurvasS';

type ResumenObra = {
  obra: {
    id: string;
    nombre: string;
    ubicacion: string;
    cliente: string;
    estado: string;
    activa: boolean;
    fechaInicio: string;
    fechaFinTeorica: string;
  };
  diasTranscurridos: number;
  duracionTotal: number;
  porcentajeTiempo: number;
  avanceFisicoObra: number;
  avanceEconomicoObra: number;
  presupuestoTeorico: number;
  presupuestoReal: number;
  totalEjecutado: number;
  resumenTitulos: {
    id: string;
    nombre: string;
    avanceFisico: number;
    presupuestoTeorico: number;
    presupuestoReal: number;
    ejecutado: number;
  }[];
};

export default function ObraDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const [resumen, setResumen] = useState<ResumenObra | null>(null);
  const [pestañaActiva, setPestañaActiva] = useState<'resumen' | 'presupuesto' | 'avance'>('resumen');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const res = await fetch(`/api/obras/${id}/resumen`, {
        headers: { Authorization: `Bearer ${obtenerToken()}` },
      });
      const json = await res.json();
      setResumen(json);
      setCargando(false);
    }
    cargar();
  }, [id]);

  if (cargando) return <p className="text-gray-500">Cargando...</p>;
  if (!resumen) return <p className="text-red-500">Error al cargar obra</p>;

  const { obra } = resumen;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
  <button
    onClick={() => router.push('/admin/obras')}
    className="text-sm text-gray-500 hover:text-gray-800 mb-2 block"
  >
    ← Volver a obras
  </button>
  <div className="flex justify-between items-start">
    <div className="flex items-center gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{obra.nombre}</h1>
        <p className="text-gray-500 text-sm">{obra.cliente} · {obra.ubicacion}</p>
      </div>
      {!obra.activa && (
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-600/10">
          Inactiva
        </span>
      )}
    </div>

    <div className="flex gap-2">
      {obra.activa ? (
        <button
          onClick={async () => {
            await fetch(`/api/obras/${id}/desactivar`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${obtenerToken()}` },
            });
            router.push('/admin/obras');
          }}
          className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-1 rounded-lg"
        >
          Desactivar obra
        </button>
      ) : (
        <button
          onClick={async () => {
            await fetch(`/api/obras/${id}/activar`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${obtenerToken()}` },
            });
            const res = await fetch(`/api/obras/${id}/resumen`, {
              headers: { Authorization: `Bearer ${obtenerToken()}` },
            });
            const json = await res.json();
            setResumen(json);
          }}
          className="text-sm text-emerald-600 hover:text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg"
        >
          Reactivar obra
        </button>
      )}
      <button
        onClick={() => router.push(`/admin/obras/${id}/editar`)}
        className="text-sm text-blue-500 hover:text-blue-700 border border-blue-200 px-3 py-1 rounded-lg"
      >
        Editar obra
      </button>
    </div>
  </div>
</div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['resumen', 'presupuesto', 'avance'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPestañaActiva(p)}
            className={`px-4 py-2 text-sm font-medium capitalize transition ${
              pestañaActiva === p
                ? 'border-b-2 border-gray-800 text-gray-800'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {pestañaActiva === 'resumen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">Avance físico</p>
              <p className="text-2xl font-bold text-gray-800">{resumen.avanceFisicoObra}%</p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full">
                <div className="h-2 bg-green-500 rounded-full" style={{ width: `${resumen.avanceFisicoObra}%` }} />
              </div>
            </div>
            <div className="bg-white border rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">Avance económico</p>
              <p className="text-2xl font-bold text-gray-800">{resumen.avanceEconomicoObra}%</p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${resumen.avanceEconomicoObra}%` }} />
              </div>
            </div>
            <div className="bg-white border rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">Tiempo transcurrido</p>
              <p className="text-2xl font-bold text-gray-800">{resumen.porcentajeTiempo}%</p>
              <p className="text-xs text-gray-400 mt-1">{resumen.diasTranscurridos} de {resumen.duracionTotal} días</p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full">
                <div className="h-2 bg-yellow-500 rounded-full" style={{ width: `${resumen.porcentajeTiempo}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">Presupuesto teórico</p>
              <p className="text-xl font-bold text-gray-800">${resumen.presupuestoTeorico.toLocaleString()}</p>
            </div>
            <div className="bg-white border rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">Presupuesto real</p>
              <p className="text-xl font-bold text-gray-800">${resumen.presupuestoReal.toLocaleString()}</p>
            </div>
            <div className="bg-white border rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">Total ejecutado</p>
              <p className="text-xl font-bold text-gray-800">${resumen.totalEjecutado.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Avance por título</h2>
            <div className="space-y-4">
              {resumen.resumenTitulos.map((titulo) => (
                <div key={titulo.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{titulo.nombre}</span>
                    <span className="text-gray-500">{titulo.avanceFisico}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-2 bg-gray-800 rounded-full transition-all"
                      style={{ width: `${titulo.avanceFisico}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400 mt-1">
                    <span>Teórico: ${titulo.presupuestoTeorico.toLocaleString()}</span>
                    <span>Real: ${titulo.presupuestoReal.toLocaleString()}</span>
                    <span>Ejecutado: ${titulo.ejecutado.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        <CurvasS obraId={id as string} />
        </div>
      )}

      {pestañaActiva === 'presupuesto' && <TabPresupuesto obraId={id as string} />}

      {pestañaActiva === 'avance' && (
      <div className="space-y-6">
        <TabAvance obraId={id as string} />
        <TabGantt obraId={id as string} fechaInicio={resumen.obra.fechaInicio} />
      </div>
      )}
    </div>
  );
}