'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obtenerToken, obtenerUsuario } from '@/app/lib/auth';

type Item = {
  id: string;
  nombre: string;
  cantidadTotal: number;
  unidad: string;
};

type Titulo = {
  id: string;
  nombre: string;
  items: Item[];
};

export default function SupervisorObraPage() {
  const { id } = useParams();
  const router = useRouter();
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [tab, setTab] = useState<'avance' | 'gasto'>('avance');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const usuario = obtenerUsuario();

  const [avance, setAvance] = useState({ itemId: '', cantidadAvanzada: 0, fecha: '' });
  const [gasto, setGasto] = useState({ itemId: '', descripcion: '', categoria: 'MATERIAL', monto: 0, fecha: '' });
  const [feedback, setFeedback] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`/api/obras/${id}/detalle`, {
          headers: { Authorization: `Bearer ${obtenerToken()}` },
        });
        if (!res.ok) throw new Error('No se pudo cargar el detalle de la obra');
        const json = await res.json();
        setTitulos(json.titulos || []);
      } catch (error) {
        console.error(error);
        setFeedback({ texto: 'Error al cargar los datos de la obra.', tipo: 'error' });
      } finally {
        setCargando(false);
      }
    }
    if (id) cargar();
  }, [id]);

  const todosLosItems = titulos.flatMap(t =>
    t.items.map(i => ({ ...i, tituloNombre: t.nombre }))
  );

  function mostrarFeedback(texto: string, tipo: 'exito' | 'error') {
    setFeedback({ texto, tipo });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function registrarAvance() {
  if (!avance.itemId || avance.cantidadAvanzada === undefined || avance.cantidadAvanzada === null || !avance.fecha) {
  mostrarFeedback('Por favor, completá todos los campos del avance.', 'error');
  return;
  }

    if (avance.cantidadAvanzada <= 0) {
      mostrarFeedback('La cantidad ejecutada debe ser mayor a cero.', 'error');
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/avance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${obtenerToken()}` },
        body: JSON.stringify({ ...avance, usuarioId: usuario?.id, obraId: id }),
      });

      const datos = await res.json();

      if (!res.ok) {
        throw new Error(datos.error || datos.message || 'Error en el servidor');
      }

      setAvance({ itemId: '', cantidadAvanzada: 0, fecha: '' });
      mostrarFeedback('¡Avance registrado con éxito!', 'exito');
    } catch (error: any) {
      mostrarFeedback(error.message || 'No se pudo registrar el avance.', 'error');
    } finally {
      setEnviando(false);
    }
  }

  async function registrarGasto() {
  if (
    !gasto.itemId || 
    gasto.monto === undefined || 
    gasto.monto === null || 
    gasto.monto <= 0 || 
    !gasto.fecha || 
    !gasto.categoria ||
    !gasto.descripcion?.trim()
  ) {
    mostrarFeedback('Por favor, completá todos los campos del gasto con un monto mayor a cero.', 'error');
    return;
  }

  setEnviando(true);
  try {
    const res = await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${obtenerToken()}` },
      body: JSON.stringify({ ...gasto, usuarioId: usuario?.id, obraId: id }),
    });

    const datos = await res.json();

    if (!res.ok) {
      throw new Error(datos.error || 'Error en el servidor');
    }

    setGasto({ itemId: '', descripcion: '', categoria: 'MATERIAL', monto: 0, fecha: '' });
    mostrarFeedback('¡Gasto registrado con éxito!', 'exito');

  } catch (error: any) {
    mostrarFeedback(error.message || 'No se pudo registrar el gasto.', 'error');
  } finally {
    setEnviando(false);
  }
}

  if (cargando) return <p className="text-gray-500 mt-12 text-center text-sm">Cargando ítems de la obra...</p>;

  return (
    <div className="animate-fadeIn">
      <button 
        onClick={() => router.push('/supervisor/obras')} 
        className="text-sm text-gray-500 mb-4 block hover:text-gray-700 active:scale-95 transition-transform"
      >
        ← Volver a mis obras
      </button>

      {feedback && (
        <div className={`px-4 py-3 rounded-xl text-sm mb-4 font-medium border border-opacity-50 ${
          feedback.tipo === 'exito' 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-red-100 text-red-800 border-red-200'
        }`}>
          {feedback.texto}
        </div>
      )}

      {/* Navegación por Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-200 rounded-xl p-1">
        <button
          disabled={enviando}
          onClick={() => setTab('avance')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition select-none ${
            tab === 'avance' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 active:bg-gray-300'
          }`}
        >
          Registrar avance
        </button>
        <button
          disabled={enviando}
          onClick={() => setTab('gasto')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition select-none ${
            tab === 'gasto' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 active:bg-gray-300'
          }`}
        >
          Registrar gasto
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
        {tab === 'avance' ? (
          <>
            <div>
              <h2 className="font-bold text-gray-800 text-lg mb-1">Nuevo avance diario</h2>
              <p className="text-xs text-gray-400 mb-3">Informá las unidades ejecutadas de un ítem.</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Ítem de obra</label>
              <select
                className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:bg-white"
                value={avance.itemId}
                onChange={e => setAvance({ ...avance, itemId: e.target.value })}
              >
                <option value="">Seleccionar ítem...</option>
                {todosLosItems.map(i => (
                  <option key={i.id} value={i.id}>{i.tituloNombre} → {i.nombre} ({i.unidad})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cantidad ejecutada</label>
              <input
                type="number" 
                placeholder="0.00"
                className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:bg-white"
                value={avance.cantidadAvanzada || ''}
                onChange={e => setAvance({ ...avance, cantidadAvanzada: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha del trabajo</label>
              <input
                type="date"
                className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:bg-white"
                value={avance.fecha}
                onChange={e => setAvance({ ...avance, fecha: e.target.value })}
              />
            </div>

            <button
              onClick={avance.itemId ? registrarAvance : undefined}
              disabled={enviando || !avance.itemId}
              className="w-full bg-gray-800 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-700 active:scale-[0.99] transition disabled:opacity-40 mt-2"
            >
              {enviando ? 'Guardando...' : 'Registrar avance'}
            </button>
          </>
        ) : (
          <>
            <div>
              <h2 className="font-bold text-gray-800 text-lg mb-1">Nuevo gasto de obra</h2>
              <p className="text-xs text-gray-400 mb-3">Registrá compras directas, mano de obra o imprevistos.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Asociar a un ítem</label>
              <select
                className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:bg-white"
                value={gasto.itemId}
                onChange={e => setGasto({ ...gasto, itemId: e.target.value })}
              >
                <option value="">Seleccionar ítem...</option>
                {todosLosItems.map(i => (
                  <option key={i.id} value={i.id}>{i.tituloNombre} → {i.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría del gasto</label>
              <select
                className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:bg-white"
                value={gasto.categoria}
                onChange={e => setGasto({ ...gasto, categoria: e.target.value })}
              >
                <option value="MATERIAL">Material</option>
                <option value="MANO_OBRA">Mano de obra</option>
                <option value="EQUIPO">Equipo</option>
                <option value="SUBCONTRATO">Subcontrato</option>
                <option value="OTROS">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Detalle / Descripción</label>
              <input
                placeholder="Ej: Compra de cemento o bolsas extra"
                className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:bg-white"
                value={gasto.descripcion}
                onChange={e => setGasto({ ...gasto, descripcion: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Monto ($)</label>
                <input
                  type="number" 
                  placeholder="Importe"
                  className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:bg-white"
                  value={gasto.monto || ''}
                  onChange={e => setGasto({ ...gasto, monto: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha comprobante</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:bg-white"
                  value={gasto.fecha}
                  onChange={e => setGasto({ ...gasto, fecha: e.target.value })}
                />
              </div>
            </div>

            <button
              onClick={gasto.itemId ? registrarGasto : undefined}
              disabled={enviando || !gasto.itemId}
              className="w-full bg-gray-800 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-700 active:scale-[0.99] transition disabled:opacity-40 mt-2"
            >
              {enviando ? 'Guardando...' : 'Registrar gasto'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}