'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { obtenerToken } from '@/app/lib/auth';

type Obra = {
  id: string;
  nombre: string;
  ubicacion: string;
  cliente: string;
  estado: string;
  activa: boolean;
};

export default function SupervisorObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function cargar() {
      try {
        const token = obtenerToken();
        const res = await fetch('/api/obras', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error('No se pudo cargar el listado de obras');
        }

        const json = await res.json();
        setObras(json);
      } catch (err) {
        console.error('Error cargando obras de supervisor:', err);
        setError('No se pudieron obtener las obras asignadas.');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const estadoColor: Record<string, string> = {
    EJECUCION: 'bg-green-100 text-green-700 border border-green-200',
    PAUSADA: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    FINALIZADA: 'bg-gray-100 text-gray-700 border border-gray-200',
  };

  const estadoLabel: Record<string, string> = {
    EJECUCION: 'En ejecución',
    PAUSADA: 'Pausada',
    FINALIZADA: 'Finalizada',
  };

  if (cargando) {
    return <p className="text-gray-500 mt-12 text-center text-sm font-medium">Cargando tus obras...</p>;
  }

  if (error) {
    return (
      <div className="mt-8 text-center px-4">
        <p className="text-red-500 text-sm mb-4 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-gray-800 text-white text-xs px-4 py-2 rounded-lg"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4 mt-2">Mis obras</h1>
      
      <div className="space-y-3">
        {obras.map(obra => (
          <div
            key={obra.id}
            onClick={() => router.push(`/supervisor/obras/${obra.id}`)}
            className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer transition select-none active:bg-gray-50 shadow-sm"
          >
            <div className="flex justify-between items-start gap-2 mb-1">
              <h2 className="font-semibold text-gray-800 text-base leading-tight">{obra.nombre}</h2>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${estadoColor[obra.estado] || 'bg-gray-100'}`}>
                {estadoLabel[obra.estado] || obra.estado}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">{obra.cliente}</p>
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
              📍 {obra.ubicacion}
            </p>
          </div>
        ))}

        {obras.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-400 text-sm">No tenés obras asignadas en este momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}