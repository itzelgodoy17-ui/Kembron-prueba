'use client';
import { useEffect, useState } from 'react';
import React from 'react';
import { obtenerToken } from '../../../../lib/auth';

type Programacion = { numeroSemana: number; cantidadPlanificada: number };
type Avance = { cantidadAvanzada: number };
type Item = { id: string; nombre: string; cantidadTotal: number; programaciones: Programacion[]; avances: Avance[] };
type Titulo = { id: string; nombre: string; items: Item[] };

export default function TabGantt({ obraId, fechaInicio }: { obraId: string; fechaInicio: string }) {
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`/api/obras/${obraId}/programacion`, {
          headers: { Authorization: `Bearer ${obtenerToken()}` },
        });
        if (res.ok) {
          const json = await res.json();
          setTitulos(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [obraId]);

  if (cargando) return <p className="text-gray-500 text-sm p-4">Cargando Diagrama...</p>;

  const maxSemana = Math.max(...titulos.flatMap(t => t.items.flatMap(i => i.programaciones.map(p => p.numeroSemana))), 8);
  const semanas = Array.from({ length: maxSemana }, (_, i) => i + 1);

  const hoy = new Date();
  const inicio = new Date(fechaInicio);
  const semanaActual = Math.floor((hoy.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <h2 className="text-base font-semibold text-gray-800 px-5 py-4 border-b">Cronograma Gantt</h2>
      <div className="overflow-x-auto">
        <table className="text-xs w-full border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 min-w-[240px]">Título / Ítem</th>
              {semanas.map(s => (
                <th key={s} className={`text-center py-3 min-w-[50px] text-gray-600 ${s === semanaActual ? 'bg-blue-50/60 font-bold text-blue-600' : ''}`}>
                  S{s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {titulos.map(titulo => (
              <React.Fragment key={titulo.id}>
                <tr className="bg-gray-50/50 border-b">
                  <td className="px-4 py-2 font-semibold text-gray-800">{titulo.nombre}</td>
                  {semanas.map(s => (
                    <td key={s} className={`py-2 ${s === semanaActual ? 'bg-blue-50/30' : ''}`}></td>
                  ))}
                </tr>
                {titulo.items.map(item => {
                  const semanasItem = item.programaciones.map(p => p.numeroSemana);
                  const primeraSemanaProg = semanasItem.length > 0 ? Math.min(...semanasItem) : null;
                  const ultimaSemanaProg = semanasItem.length > 0 ? Math.max(...semanasItem) : null;
                  
                  const avanceAcumulado = item.avances.reduce((s, a) => s + a.cantidadAvanzada, 0);
                  const porcentajeTotal = Math.min(100, (avanceAcumulado / item.cantidadTotal) * 100);

                  const totalSemanasDuracion = (primeraSemanaProg && ultimaSemanaProg) ? (ultimaSemanaProg - primeraSemanaProg + 1) : 1;

                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition">
                      <td className="px-4 py-2.5 pl-8 text-gray-700">
                        <div className="font-medium">{item.nombre}</div>
                        <div className="text-gray-400 text-[10px]">{porcentajeTotal.toFixed(0)}% completado ({avanceAcumulado} de {item.cantidadTotal})</div>
                      </td>
                      {semanas.map(s => {
                        const esCeldaInicio = primeraSemanaProg !== null && s === primeraSemanaProg;
                        const dentroRango = primeraSemanaProg !== null && ultimaSemanaProg !== null && s >= primeraSemanaProg && s <= ultimaSemanaProg;

                        return (
                          <td key={s} className={`py-2 px-0 relative ${s === semanaActual ? 'bg-blue-50/30' : ''}`} style={{ height: '38px' }}>
                            {dentroRango && (
                              <div 
                                className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-4 bg-gray-200/80 z-0"
                                style={{
                                  borderLeft: esCeldaInicio ? '1px solid #d1d5db' : 'none',
                                }}
                              >
                                {(() => {
                                  const posicionCeldaActual = s - primeraSemanaProg; 
                                  const progresoPorSemana = 100 / totalSemanasDuracion;
                                  
                                  const inicioProgresoCelda = posicionCeldaActual * progresoPorSemana;
                                  let anchoCeldaVerde = 0;

                                  if (porcentajeTotal > inicioProgresoCelda) {
                                    const restante = porcentajeTotal - inicioProgresoCelda;
                                    anchoCeldaVerde = Math.min(100, (restante / progresoPorSemana) * 100);
                                  }

                                  return (
                                    <div 
                                      className="h-full bg-green-500 transition-all duration-300"
                                      style={{ width: `${anchoCeldaVerde}%` }}
                                    />
                                  );
                                })()}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div className="px-5 py-3 border-t flex flex-wrap items-center gap-4 text-[11px] text-gray-500 bg-gray-50/50">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
            <span>Semana actual (S{semanaActual})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Avance real (Proporcional)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>Lapsos Programados</span>
          </div>
        </div>
      </div>
    </div>
  );
}