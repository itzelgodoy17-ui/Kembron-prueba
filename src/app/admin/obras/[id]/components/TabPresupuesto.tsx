'use client';
import { useEffect, useState, useCallback } from 'react';
import { obtenerToken } from '../../../../lib/auth';
import React from 'react';
import { Trash2 } from 'lucide-react'; 

type Modificacion = { id: string; tipo: string; nombre: string; monto: number };
// 1. ACTUALIZADO: Agregamos el objeto usuario opcional al tipo Gasto
type Gasto = { 
  id: string; 
  descripcion: string; 
  categoria: string; 
  monto: number; 
  fecha: string;
  usuario?: { nombre: string } | null; 
};
type Item = {
  id: string;
  nombre: string;
  cantidadTotal: number;
  decay?: boolean; // por si acaso
  unidad: string;
  valorUnitario: number;
  modificaciones: Modificacion[];
  gastos: Gasto[];
};
type Titulo = { id: string; nombre: string; items: Item[] };

export default function TabPresupuesto({ obraId }: { obraId: string }) {
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [subTab, setSubTab] = useState<'items' | 'adicionales' | 'gastos'>('items');
  const [cargando, setCargando] = useState(true);

  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoItem, setNuevoItem] = useState({ tituloId: '', nombre: '', cantidadTotal: 0, unidad: '', valorUnitario: 0 });
  const [nuevoAdicional, setNuevoAdicional] = useState({ itemId: '', tipo: 'ADICIONAL', nombre: '', monto: 0 });
  const [nuevoGasto, setNuevoGasto] = useState({ itemId: '', descripcion: '', categoria: 'MATERIAL', monto: 0, fecha: '' });

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/obras/${obraId}/detalle`, {
        headers: { Authorization: `Bearer ${obtenerToken()}` },
      });
      if (!res.ok) throw new Error('Error al cargar detalles');
      const json = await res.json();
      setTitulos(json.titulos || []);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  }, [obraId]);

  useEffect(() => { 
    cargar(); 
  }, [cargar]);

  const handleEliminarItem = async (itemId: string) => {
    if (!confirm("¿Seguro querés eliminar este ítem? Se borrarán permanentemente sus programaciones, gastos y avances asociados.")) return;
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${obtenerToken()}` },
      });
      if (res.ok) {
        cargar(); 
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'No se pudo eliminar el ítem.'}`);
      }
    } catch (error) {
      console.error("Error al eliminar item:", error);
    }
  };

  const handleEliminarTitulo = async (tituloId: string) => {
    if (!confirm("¿Seguro querés eliminar este título? Esto borrará también TODOS los ítems contenidos en él.")) return;
    try {
      const res = await fetch(`/api/titulos/${tituloId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${obtenerToken()}` },
      });
      if (res.ok) {
        cargar();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'No se pudo eliminar el título.'}`);
      }
    } catch (error) {
      console.error("Error al eliminar título:", error);
    }
  };

  async function crearTitulo() {
    if (!nuevoTitulo.trim()) return;
    await fetch('/api/titulos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${obtenerToken()}` },
      body: JSON.stringify({ obraId, nombre: nuevoTitulo }),
    });
    setNuevoTitulo('');
    cargar();
  }

  async function crearItem() {
    if (!nuevoItem.nombre.trim() || !nuevoItem.tituloId) return;
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${obtenerToken()}` },
      body: JSON.stringify(nuevoItem),
    });
    setNuevoItem({ tituloId: '', nombre: '', cantidadTotal: 0, unidad: '', valorUnitario: 0 });
    cargar();
  }

  async function crearAdicional() {
    if (!nuevoAdicional.itemId || !nuevoAdicional.nombre.trim()) return;
    await fetch('/api/adicionales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${obtenerToken()}` },
      body: JSON.stringify(nuevoAdicional),
    });
    setNuevoAdicional({ itemId: '', tipo: 'ADICIONAL', nombre: '', monto: 0 });
    cargar();
  }

  async function crearGasto() {
    if (
      !nuevoGasto.itemId || 
      !nuevoGasto.descripcion?.trim() || 
      !nuevoGasto.fecha || 
      !nuevoGasto.categoria || 
      nuevoGasto.monto <= 0
    ) {
      alert('Por favor, completá todos los campos y asegurate de que el monto sea mayor a cero.');
      return;
    }

    try {
      const payloadGasto = {
        itemId: nuevoGasto.itemId,
        descripcion: nuevoGasto.descripcion.trim(),
        categoria: nuevoGasto.categoria,
        monto: Number(nuevoGasto.monto),
        fecha: nuevoGasto.fecha,
      };

      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${obtenerToken()}` 
        },
        body: JSON.stringify(payloadGasto), 
      });

      const datos = await res.json();
      if (!res.ok) {
        throw new Error(datos.error || 'Error en el servidor al guardar el gasto');
      }

      setNuevoGasto({ itemId: '', descripcion: '', categoria: 'MATERIAL', monto: 0, fecha: '' });
      await cargar();
      alert('¡Gasto registrado con éxito!');

    } catch (error: any) {
      console.error(error);
      alert(error.message || 'No se pudo guardar el gasto.');
    }
  }

  const todosLosItems = titulos.flatMap(t => t.items.map(i => ({ ...i, tituloNombre: t.nombre })));

  if (cargando) return <p className="text-gray-500 p-4">Cargando presupuesto...</p>;

  return (
    <div>
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {(['items', 'adicionales', 'gastos'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSubTab(s)}
            className={`pb-2 text-sm font-medium capitalize transition ${
              subTab === s ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {s === 'items' ? 'Títulos e ítems' : s === 'adicionales' ? 'Adicionales y deductivos' : 'Gastos'}
          </button>
        ))}
      </div>

      {subTab === 'items' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-4 flex gap-3">
            <input
              value={nuevoTitulo}
              onChange={e => setNuevoTitulo(e.target.value)}
              placeholder="Nombre del título (ej: 01. Estructuras)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={crearTitulo} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
              + Título
            </button>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600">Título / Ítem</th>
                  <th className="text-right px-4 py-3 text-gray-600">Cantidad</th>
                  <th className="text-right px-4 py-3 text-gray-600">V. Unitario</th>
                  <th className="text-right px-4 py-3 text-gray-600">P. Teórico</th>
                  <th className="text-right px-4 py-3 text-gray-600">P. Real</th>
                  <th className="text-right px-4 py-3 text-gray-600">Ejecutado</th>
                  <th className="text-center px-4 py-3 text-gray-600 w-12">Acción</th>
                </tr>
              </thead>
              <tbody>
                {titulos.map(titulo => {
                  const teorTitulo = titulo.items.reduce((s, i) => s + i.cantidadTotal * i.valorUnitario, 0);
                  const realTitulo = titulo.items.reduce((s, i) => {
                    const ad = i.modificaciones.filter(m => m.tipo === 'ADICIONAL').reduce((a, m) => a + m.monto, 0);
                    const de = i.modificaciones.filter(m => m.tipo === 'DEDUCTIVO').reduce((a, m) => a + m.monto, 0);
                    return s + (i.cantidadTotal * i.valorUnitario) + ad - de;
                  }, 0);
                  const ejTitulo = titulo.items.reduce((s, i) => s + i.gastos.reduce((a, g) => a + g.monto, 0), 0);

                  return (
                    <React.Fragment key={titulo.id}>
                      <tr className="bg-gray-50 border-b font-semibold">
                        <td className="px-4 py-2 text-gray-800 flex items-center justify-between group">
                          <span>{titulo.nombre}</span>
                          <button 
                            onClick={() => handleEliminarTitulo(titulo.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            title="Eliminar título completo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                        <td colSpan={2}></td>
                        <td className="text-right px-4 py-2">${teorTitulo.toLocaleString()}</td>
                        <td className="text-right px-4 py-2">${realTitulo.toLocaleString()}</td>
                        <td className="text-right px-4 py-2">${ejTitulo.toLocaleString()}</td>
                        <td></td>
                      </tr>
                      {titulo.items.map(item => {
                        const teo = item.cantidadTotal * item.valorUnitario;
                        const ad = item.modificaciones.filter(m => m.tipo === 'ADICIONAL').reduce((a, m) => a + m.monto, 0);
                        const de = item.modificaciones.filter(m => m.tipo === 'DEDUCTIVO').reduce((a, m) => a + m.monto, 0);
                        const ej = item.gastos.reduce((a, g) => a + g.monto, 0);
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">{item.nombre}</td>
                            <td className="text-right px-4 py-2 text-gray-500">{item.cantidadTotal} {item.unidad}</td>
                            <td className="text-right px-4 py-2 text-gray-500">${item.valorUnitario}</td>
                            <td className="text-right px-4 py-2">${teo.toLocaleString()}</td>
                            <td className="text-right px-4 py-2">${(teo + ad - de).toLocaleString()}</td>
                            <td className="text-right px-4 py-2">${ej.toLocaleString()}</td>
                            <td className="text-center px-4 py-2">
                              <button 
                                onClick={() => handleEliminarItem(item.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Eliminar ítem"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="border-b bg-blue-50/60">
                        <td className="px-4 py-2 pl-8">
                          <input
                            placeholder="Nuevo ítem"
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                            value={nuevoItem.tituloId === titulo.id ? nuevoItem.nombre : ''}
                            onChange={e => setNuevoItem({ ...nuevoItem, tituloId: titulo.id, nombre: e.target.value })}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" placeholder="Cant."
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                            value={nuevoItem.tituloId === titulo.id ? nuevoItem.cantidadTotal || '' : ''}
                            onChange={e => setNuevoItem({ ...nuevoItem, tituloId: titulo.id, cantidadTotal: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input placeholder="Unidad"
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                            value={nuevoItem.tituloId === titulo.id ? nuevoItem.unidad : ''}
                            onChange={e => setNuevoItem({ ...nuevoItem, tituloId: titulo.id, unidad: e.target.value })}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" placeholder="V. Unit."
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                            value={nuevoItem.tituloId === titulo.id ? nuevoItem.valorUnitario || '' : ''}
                            onChange={e => setNuevoItem({ ...nuevoItem, tituloId: titulo.id, valorUnitario: Number(e.target.value) })}
                          />
                        </td>
                        <td colSpan={3} className="px-2 py-2">
                          <button onClick={crearItem} className="bg-gray-800 text-white px-3 py-1 rounded text-xs w-full hover:bg-gray-700">
                            + Ítem
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );       
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'adicionales' && (
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-4 grid grid-cols-2 gap-3">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={nuevoAdicional.itemId}
              onChange={e => setNuevoAdicional({ ...nuevoAdicional, itemId: e.target.value })}
            >
              <option value="">Seleccionar ítem</option>
              {todosLosItems.map(i => <option key={i.id} value={i.id}>{i.tituloNombre} → {i.nombre}</option>)}
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={nuevoAdicional.tipo}
              onChange={e => setNuevoAdicional({ ...nuevoAdicional, tipo: e.target.value })}
            >
              <option value="ADICIONAL">Adicional</option>
              <option value="DEDUCTIVO">Deductivo</option>
            </select>
            <input
              placeholder="Nombre / descripción"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
              value={nuevoAdicional.nombre}
              onChange={e => setNuevoAdicional({ ...nuevoAdicional, nombre: e.target.value })}
            />
            <input
              type="number" placeholder="Monto"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={nuevoAdicional.monto || ''}
              onChange={e => setNuevoAdicional({ ...nuevoAdicional, monto: Number(e.target.value) })}
            />
            <button onClick={crearAdicional} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
              + Agregar
            </button>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600">Ítem</th>
                  <th className="text-left px-4 py-3 text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 text-gray-600">Nombre</th>
                  <th className="text-right px-4 py-3 text-gray-600">Monto</th>
                </tr>
              </thead>
              <tbody>
                {todosLosItems.flatMap(item =>
                  item.modificaciones.map(mod => (
                    <tr key={mod.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700">{item.nombre}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${mod.tipo === 'ADICIONAL' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {mod.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{mod.nombre}</td>
                      <td className="text-right px-4 py-2 font-medium">${mod.monto.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'gastos' && (
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-4 grid grid-cols-2 gap-3">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={nuevoGasto.itemId}
              onChange={e => setNuevoGasto({ ...nuevoGasto, itemId: e.target.value })}
            >
              <option value="">Seleccionar ítem</option>
              {todosLosItems.map(i => <option key={i.id} value={i.id}>{i.tituloNombre} → {i.nombre}</option>)}
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={nuevoGasto.categoria}
              onChange={e => setNuevoGasto({ ...nuevoGasto, categoria: e.target.value })}
            >
              <option value="MATERIAL">Material</option>
              <option value="MANO_OBRA">Mano de obra</option>
              <option value="EQUIPO">Equipo</option>
              <option value="SUBCONTRATO">Subcontrato</option>
              <option value="OTROS">Otros</option>
            </select>
            <input
              placeholder="Descripción"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
              value={nuevoGasto.descripcion}
              onChange={e => setNuevoGasto({ ...nuevoGasto, descripcion: e.target.value })}
            />
            <input
              type="number" placeholder="Monto"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={nuevoGasto.monto || ''}
              onChange={e => setNuevoGasto({ ...nuevoGasto, monto: Number(e.target.value) })}
            />
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={nuevoGasto.fecha}
              onChange={e => setNuevoGasto({ ...nuevoGasto, fecha: e.target.value })}
            />
            <button onClick={crearGasto} className="col-span-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
              + Registrar gasto
            </button>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600">Ítem</th>
                  <th className="text-left px-4 py-3 text-gray-600">Categoría</th>
                  <th className="text-left px-4 py-3 text-gray-600">Descripción</th>
                  <th className="text-left px-4 py-3 text-gray-600">Usuario</th> 
                  <th className="text-left px-4 py-3 text-gray-600">Fecha</th>
                  <th className="text-right px-4 py-3 text-gray-600">Monto</th>
                </tr>
              </thead>
              <tbody>
                {todosLosItems.flatMap(item =>
                  item.gastos.map(gasto => (
                    <tr key={gasto.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700">{item.nombre}</td>
                      <td className="px-4 py-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">{gasto.categoria}</span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{gasto.descripcion}</td>
                      <td className="px-4 py-2 text-gray-600 font-medium">
                        {gasto.usuario?.nombre || <span className="text-gray-400 italic text-xs">Sin asignar</span>}
                      </td>
                      <td className="px-4 py-2 text-gray-400">
                        {gasto.fecha ? new Date(gasto.fecha).toLocaleDateString('es-AR') : '-'}
                      </td>
                      <td className="text-right px-4 py-2 font-medium">${gasto.monto.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}