'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obtenerToken } from '@/app/lib/auth';

export default function EditarObraPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '', ubicacion: '', cliente: '',
    estado: 'EJECUCION', activa: true,
    fechaInicio: '', fechaFinTeorica: ''
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`/api/obras/${id}/detalle`, {
          headers: { Authorization: `Bearer ${obtenerToken()}` },
        });
        if (!res.ok) throw new Error('No se pudo obtener el detalle de la obra');
        
        const json = await res.json();
        setForm({
          nombre: json.nombre || '',
          ubicacion: json.ubicacion || '',
          cliente: json.cliente || '',
          estado: json.estado || 'EJECUCION',
          activa: json.activa ?? true,
          fechaInicio: json.fechaInicio ? json.fechaInicio.split('T')[0] : '',
          fechaFinTeorica: json.fechaFinTeorica ? json.fechaFinTeorica.split('T')[0] : '',
        });
      } catch (error) {
        console.error('Error al cargar obra:', error);
        alert('Error al cargar los datos de la obra.');
      } finally {
        setCargando(false);
      }
    }
    if (id) cargar();
  }, [id]);

  async function guardar() {
    if (!form.nombre.trim() || !form.ubicacion.trim() || !form.cliente.trim()) {
      alert('Por favor, completa los campos requeridos.');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`/api/obras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${obtenerToken()}` },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Error al actualizar');
      
      router.push(`/admin/obras/${id}`);
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('No se pudieron guardar los cambios en el servidor.');
      setGuardando(false);
    }
  }

  if (cargando) return <p className="text-gray-500 p-6">Cargando datos de la obra...</p>;

  return (
    <div className="max-w-lg">
      <button onClick={() => router.back()} className="text-sm text-gray-500 mb-4 block hover:text-gray-700">
        ← Volver
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar obra</h1>

      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
            <option value="EJECUCION">En ejecución</option>
            <option value="PAUSADA">Pausada</option>
            <option value="FINALIZADA">Finalizada</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.fechaInicio} onChange={e => setForm({ ...form, fechaInicio: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin teórica</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.fechaFinTeorica} onChange={e => setForm({ ...form, fechaFinTeorica: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-2 py-1">
          <input type="checkbox" id="activa" checked={form.activa}
            className="rounded border-gray-300 text-gray-800 focus:ring-gray-800"
            onChange={e => setForm({ ...form, activa: e.target.checked })} />
          <label htmlFor="activa" className="text-sm text-gray-700 select-none">Obra activa</label>
        </div>
        <button onClick={guardar} disabled={guardando}
          className="w-full bg-gray-800 text-white py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 transition">
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}