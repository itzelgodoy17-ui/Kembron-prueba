'use client';
import { useEffect, useState } from 'react';
import { obtenerToken, obtenerUsuario } from '../../../../lib/auth';
import React from 'react';

type Programacion = { numeroSemana: number; cantidadPlanificada: number };
type Avance = { id: string; cantidadAvanzada: number; fecha: string; usuario: { nombre: string } };
type Item = { id: string; nombre: string; cantidadTotal: number; unidad: string; programaciones: Programacion[]; avances: Avance[] };
type Titulo = { id: string; nombre: string; items: Item[] };

export default function TabAvance({ obraId }: { obraId: string }) {
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [subTab, setSubTab] = useState<'avance' | 'programacion'>('avance');
  const [cargando, setCargando] = useState(true);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [nuevoAvance, setNuevoAvance] = useState({ itemId: '', cantidadAvanzada: 0, fecha: '' });
  const [guardando, setGuardando] = useState(false);
  const usuario = obtenerUsuario();

  async function cargar() {
    try {
      const res = await fetch(`/api/obras/${obraId}/programacion`, {
        headers: { Authorization: `Bearer ${obtenerToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        setTitulos(json);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [obraId]);

  function toggleExpandido(id: string) {
    setExpandidos(prev => {
      const nuevo = new Set(prev);
      nuevo.has(id) ? nuevo.delete(id) : nuevo.add(id);
      return nuevo;
    });
  }

  async function registrarAvance() {
  if (!nuevoAvance.itemId || nuevoAvance.cantidadAvanzada === undefined || nuevoAvance.cantidadAvanzada === null || !nuevoAvance.fecha) {
    alert('Por favor, completá todos los campos.');
    return;
  }
  
  if (nuevoAvance.cantidadAvanzada <= 0) {
    alert('La cantidad avanzada debe ser mayor a cero.');
    return;
  }

  setGuardando(true);
  try {
    const res = await fetch('/api/avance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${obtenerToken()}` },
      body: JSON.stringify({ ...nuevoAvance, usuarioId: usuario?.id }),
    });

    const datos = await res.json();
    if (!res.ok) {
      throw new Error(datos.error || 'Error al registrar avance');
    }

    setNuevoAvance({ itemId: '', cantidadAvanzada: 0, fecha: '' });
    await cargar();
  } catch (error: any) {
    console.error(error);
    alert(error.message);
  } finally {
    setGuardando(false);
  }
}

  async function eliminarAvance(avanceId: string) {
    if (!confirm("¿Seguro querés eliminar este registro de avance físico?")) return;
    try {
      const res = await fetch(`/api/avance/${avanceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${obtenerToken()}` },
      });
      if (res.ok) {
        await cargar();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'No se pudo eliminar el avance.'}`);
      }
    } catch (error) {
      console.error("Error al eliminar avance:", error);
    }
  }

  async function guardarProgramacion(itemId: string, semanas: Programacion[]) {
    try {
      await fetch('/api/programacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${obtenerToken()}` },
        body: JSON.stringify({ itemId, semanas }),
      });
      await cargar();
    } catch (error) {
      console.error(error);
    }
  }

  const todosLosItems = titulos.flatMap(t => t.items.map(i => ({ ...i, tituloNombre: t.nombre })));
  const maxSemana = Math.max(...todosLosItems.flatMap(i => i.programaciones.map(p => p.numeroSemana)), 8);
  const semanas = Array.from({ length: maxSemana }, (_, i) => i + 1);

  if (cargando) return <p className="text-gray-500 text-sm p-4">Cargando planificación...</p>;

  return (
    <div>
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {(['avance', 'programacion'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSubTab(s)}
            className={`pb-2 text-sm font-medium capitalize transition ${
              subTab === s ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {s === 'avance' ? 'Avance real' : 'Programación'}
          </button>
        ))}
      </div>

      {subTab === 'avance' && (
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-transparent"
              value={nuevoAvance.itemId}
              onChange={e => setNuevoAvance({ ...nuevoAvance, itemId: e.target.value })}
            >
              <option value="">Seleccionar ítem</option>
              {todosLosItems.map(i => (
                <option key={i.id} value={i.id}>{i.tituloNombre} → {i.nombre}</option>
              ))}
            </select>
            <input
              type="number" placeholder="Cantidad avanzada"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={nuevoAvance.cantidadAvanzada || ''}
              onChange={e => setNuevoAvance({ ...nuevoAvance, cantidadAvanzada: Number(e.target.value) })}
            />
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={nuevoAvance.fecha}
              onChange={e => setNuevoAvance({ ...nuevoAvance, fecha: e.target.value })}
            />
            <button
              onClick={registrarAvance}
              disabled={guardando}
              className="md:col-span-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              {guardando ? 'Registrando...' : '+ Registrar avance'}
            </button>
          </div>

          <div className="space-y-2">
            {titulos.map(titulo => (
              <div key={titulo.id} className="bg-white border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleExpandido(titulo.id)}
                  className="w-full flex justify-between items-center px-5 py-3 hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-800">{titulo.nombre}</span>
                  <span className="text-gray-400 text-sm">{expandidos.has(titulo.id) ? '▲' : '▼'}</span>
                </button>

                {expandidos.has(titulo.id) && (
                  <div className="border-t">
                    {titulo.items.map(item => {
                      const avanceAcumulado = item.avances.reduce((s, a) => s + a.cantidadAvanzada, 0);
                      const porcentaje = Math.min(100, (avanceAcumulado / item.cantidadTotal) * 100);

                      return (
                        <div key={item.id} className="border-b last:border-0">
                          <button
                            onClick={() => toggleExpandido(item.id)}
                            className="w-full flex justify-between items-center px-5 py-3 pl-8 hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-gray-700 text-sm">{item.nombre}</span>
                              <span className="text-xs text-gray-400">{avanceAcumulado} / {item.cantidadTotal} {item.unidad}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-2 bg-green-500" style={{ width: `${porcentaje}%` }} />
                              </div>
                              <span className="text-sm font-medium text-gray-600">{porcentaje.toFixed(1)}%</span>
                              <span className="text-gray-400 text-xs">{expandidos.has(item.id) ? '▲' : '▼'}</span>
                            </div>
                          </button>

                          {expandidos.has(item.id) && (
                            <div className="px-8 pb-3 overflow-x-auto">
                              <table className="w-full text-xs min-w-[400px]">
                                <thead>
                                  <tr className="text-gray-400 border-b">
                                    <th className="text-left py-1.5 font-medium">Fecha</th>
                                    <th className="text-right py-1.5 font-medium">Cantidad</th>
                                    <th className="text-left py-1.5 pl-4 font-medium">Usuario</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.avances.length === 0 ? (
                                    <tr>
                                      <td colSpan={3} className="py-2 text-gray-400 italic">No hay avances registrados.</td>
                                    </tr>
                                  ) : (
                                    item.avances.map(av => (
                                      <tr key={av.id} className="border-t border-gray-100">
                                        <td className="py-1.5 text-gray-500">{new Date(av.fecha).toLocaleDateString('es-AR')}</td>
                                        <td className="text-right py-1.5 font-medium">{av.cantidadAvanzada} {item.unidad}</td>
                                        <td className="py-1.5 pl-4 text-gray-400">{av.usuario?.nombre || 'Sistema'}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'programacion' && (
        <div className="bg-white border rounded-xl overflow-auto shadow-sm">
          <table className="text-xs w-full border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 min-w-[220px]">Título / Ítem</th>
                {semanas.map(s => (
                  <th key={s} className="text-center px-2 py-3 text-gray-600 min-w-[70px]">Sem {s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {titulos.map(titulo => (
                <React.Fragment key={titulo.id}>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    <td className="px-4 py-2 font-semibold text-gray-800">{titulo.nombre}</td>
                    {semanas.map(s => <td key={s}></td>)}
                  </tr>
                  {titulo.items.map(item => {
                    const progMap = new Map(item.programaciones.map(p => [p.numeroSemana, p.cantidadPlanificada]));
                    return (
                      <tr key={item.id} className="border-b border-gray-150 hover:bg-gray-50/50">
                        <td className="px-4 py-2 pl-8 text-gray-700 font-medium">{item.nombre}</td>
                        {semanas.map(s => (
                          <td key={s} className="px-1 py-1 text-center">
                            <input
                              type="number"
                              min="0"
                              className="w-14 border border-gray-200 rounded px-1 py-1 text-center text-xs focus:border-gray-400 focus:outline-none"
                              defaultValue={progMap.get(s) || ''}
                              onBlur={e => {
                                const val = Math.max(0, Number(e.target.value));
                                const actualVal = progMap.get(s) || 0;
                                
                                if (val === actualVal) return;

                                const otrasSemanasSuma = semanas
                                  .filter(sem => sem !== s)
                                  .reduce((suma, sem) => suma + (progMap.get(sem) || 0), 0);

                                if (otrasSemanasSuma + val > item.cantidadTotal) {
                                  alert(`No podés programar más de la cantidad total disponible (${item.cantidadTotal} ${item.unidad || ''}). Actualmente planeás programar ${(otrasSemanasSuma + val)}.`);
                                  e.target.value = actualVal ? String(actualVal) : ''; 
                                  return;
                                }

                                const nuevasProg = semanas
                                  .map(sem => ({
                                    numeroSemana: sem,
                                    cantidadPlanificada: sem === s ? val : (progMap.get(sem) || 0)
                                  }))
                                  .filter(p => p.cantidadPlanificada > 0);
                                
                                guardarProgramacion(item.id, nuevasProg);
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}