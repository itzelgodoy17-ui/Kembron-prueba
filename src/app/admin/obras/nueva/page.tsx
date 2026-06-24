'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { obtenerToken } from '@/app/lib/auth';

export default function NuevaObraPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '', ubicacion: '', cliente: '',
    estado: 'EJECUCION', activa: true,
    fechaInicio: '', fechaFinTeorica: ''
  });
  const [cargando, setCargando] = useState(false);

  async function crearObra() {
    if (!form.nombre.trim() || !form.ubicacion.trim() || !form.cliente.trim() || !form.fechaInicio || !form.fechaFinTeorica) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }
    
    setCargando(true);
    try {
      const res = await fetch('/api/obras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${obtenerToken()}` },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Error al procesar la solicitud');

      router.push('/admin/obras');
    } catch (error) {
      console.error('Error al crear obra:', error);
      alert('Hubo un problema al crear la obra en el servidor.');
      setCargando(false);
    }
  }

  return (
    <div className="max-w-lg">
      <button onClick={() => router.push('/admin/obras')} className="text-sm text-gray-500 mb-4 block hover:text-gray-700">
        ← Volver a obras
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nueva obra</h1>

      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Ej: Complejo Residencial San Juan"
            value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Ej: Av. Rivadavia 1420, CABA"
            value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Nombre de la empresa o cliente"
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
        <button onClick={crearObra} disabled={cargando}
          className="w-full bg-gray-800 text-white py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 transition">
          {cargando ? 'Creando obra...' : 'Crear obra'}
        </button>
      </div>
    </div>
  );
}