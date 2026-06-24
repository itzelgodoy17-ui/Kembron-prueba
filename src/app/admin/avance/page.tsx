'use client';
import { useEffect, useState } from 'react';
import { obtenerToken } from '@/app/lib/auth';
import { TrendingUp, Calendar, BarChart3, Activity } from 'lucide-react';

type SemanaCurva = {
  semana: number;
  valorPlanificadoSemanal: number;
  valorPlanificadoAcumulado: number;
  avanceFisicoSemanal: number;
  avanceFisicoAcumulado: number;
  gastoRealSemanal: number;
  gastoRealAcumulado: number;
};

type CurvaResponse = {
  obraNombre: string;
  curvas: SemanaCurva[];
};

type ObraSimple = {
  id: string;
  nombre: string;
};

export default function AvancePage() {
  const [obras, setObras] = useState<ObraSimple[]>([]);
  const [idObraSeleccionada, setIdObraSeleccionada] = useState<string>('');
  const [datosCurva, setDatosCurva] = useState<CurvaResponse | null>(null);
  const [cargandoCurva, setCargandoCurva] = useState(false);

  useEffect(() => {
    async function cargarObras() {
      try {
        const res = await fetch('/api/obras', {
          headers: { Authorization: `Bearer ${obtenerToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          const lista = Array.isArray(data) ? data : data.obras || [];
          setObras(lista);
          if (lista.length > 0) setIdObraSeleccionada(lista[0].id);
        }
      } catch (err) {
        console.error('Error cargando obras:', err);
      }
    }
    cargarObras();
  }, []);

  useEffect(() => {
    if (!idObraSeleccionada) return;

    async function cargarCurvas() {
      setCargandoCurva(true);
      try {
        const res = await fetch(`/api/curvas?obraId=${idObraSeleccionada}`, {
          headers: { Authorization: `Bearer ${obtenerToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDatosCurva(data);
        }
      } catch (err) {
        console.error('Error cargando curvas:', err);
      } finally {
        setCargandoCurva(false);
      }
    }
    cargarCurvas();
  }, [idObraSeleccionada]);

  const semanas = datosCurva?.curvas || [];
  const maxValor = semanas.length > 0 
    ? Math.max(...semanas.map(s => Math.max(s.valorPlanificadoAcumulado, s.avanceFisicoAcumulado, s.gastoRealAcumulado)), 1000)
    : 1000;

  const getCoords = (index: number, valor: number) => {
    const x = 50 + (index * 100); 
    const y = 260 - ((valor / maxValor) * 220); 
    return `${x},${y}`;
  };

  const pointsPlanificado = semanas.map((s, i) => getCoords(i, s.valorPlanificadoAcumulado)).join(' ');
  const pointsAvance = semanas.map((s, i) => getCoords(i, s.avanceFisicoAcumulado)).join(' ');
  const pointsGasto = semanas.map((s, i) => getCoords(i, s.gastoRealAcumulado)).join(' ');

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Seguimiento de Avance</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Curva S de control financiero: Comparación entre planificación, avance físico y egresos reales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:block">Obra:</label>
          <select
            value={idObraSeleccionada}
            onChange={(e) => setIdObraSeleccionada(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all cursor-pointer"
          >
            {obras.map((o) => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {cargandoCurva ? (
        <div className="h-96 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm">
          <p className="text-sm font-medium text-gray-400 animate-pulse">Procesando matriz e hitos de obra...</p>
        </div>
      ) : datosCurva && semanas.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Curvas s */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-gray-800 tracking-tight">Curva S de Avance Acumulado</h3>
                </div>
                <div className="flex gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 block"/>Previsto</span>
                  <span className="flex items-center gap-1.5 text-blue-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 block"/>Avance Físico</span>
                  <span className="flex items-center gap-1.5 text-amber-500"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"/>Gasto Real</span>
                </div>
              </div>

              <div className="w-full overflow-x-auto pt-4">
                <svg viewBox="0 0 800 300" className="w-full h-auto overflow-visible">
                  {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                    <line 
                      key={idx} x1="40" y1={260 - (p * 220)} x2="760" y2={260 - (p * 220)} 
                      className="stroke-gray-100 stroke-1" strokeDasharray="4 4"
                    />
                  ))}

                  <polyline points={pointsPlanificado} fill="none" className="stroke-gray-300 stroke-[3]" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={pointsAvance} fill="none" className="stroke-blue-500 stroke-[3.5]" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={pointsGasto} fill="none" className="stroke-amber-500 stroke-[3]" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2" />

                  {semanas.map((s, i) => {
                    const cx = 50 + (i * 100);
                    return (
                      <g key={i} className="group cursor-pointer">
                        {s.avanceFisicoAcumulado > 0 && (
                          <circle cx={cx} cy={260 - ((s.avanceFisicoAcumulado / maxValor) * 220)} r="4" className="fill-blue-600 stroke-white stroke-2 shadow" />
                        )}
                        {s.gastoRealAcumulado > 0 && (
                          <circle cx={cx} cy={260 - ((s.gastoRealAcumulado / maxValor) * 220)} r="4" className="fill-amber-600 stroke-white stroke-2 shadow" />
                        )}
                        <text x={cx} y="285" textAnchor="middle" className="text-[11px] fill-gray-400 font-bold uppercase">Sem {s.semana}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            
            <p className="text-[11px] text-gray-400 italic mt-4">
              * El desfase entre la línea azul (valorización del avance) y la naranja (egresos reales) expone el nivel de eficiencia en las compras.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-4">
                <BarChart3 className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-gray-800 tracking-tight">Métricas por Semana</h3>
              </div>
              
              <div className="overflow-y-auto max-h-[340px] pr-1 space-y-2.5">
                {semanas.map((sem) => (
                  <div key={sem.semana} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-gray-800">
                      <span>Semana {sem.semana}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-medium text-gray-500">
                      <div>
                        <span className="block text-[10px] text-gray-400 font-semibold uppercase">Previsto</span>
                        <span className="text-gray-700 font-semibold">${sem.valorPlanificadoAcumulado.toLocaleString('es-AR')}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-blue-500 font-semibold uppercase">Físico</span>
                        <span className="text-blue-600 font-bold">${sem.avanceFisicoAcumulado.toLocaleString('es-AR')}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-amber-500 font-semibold uppercase">Gastado</span>
                        <span className="text-amber-600 font-bold">${sem.gastoRealAcumulado.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="h-64 bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-sm text-gray-400">
          No hay datos de planificación cargados para esta obra en la base de datos.
        </div>
      )}
    </div>
  );
}