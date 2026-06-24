'use client';
import { useEffect, useState } from 'react';
import { obtenerToken } from '../../lib/auth';

type Obra = { id: string; nombre: string };
type Usuario = { id: string; email: string; nombre: string; rol: string };

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', password: '', rol: 'SUPERVISOR' });
  const [asignacion, setAsignacion] = useState({ usuarioId: '', obraId: '' });
  const [editando, setEditando] = useState<Usuario | null>(null);

  async function cargar() {
    try {
      const [resU, resO] = await Promise.all([
        fetch('/api/usuarios', { headers: { Authorization: `Bearer ${obtenerToken()}` } }),
        fetch('/api/obras', { headers: { Authorization: `Bearer ${obtenerToken()}` } }),
      ]);
      if (!resU.ok || !resO.ok) throw new Error('Error al sincronizar datos');
      setUsuarios(await resU.json());
      setObras(await resO.json());
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function crearUsuario() {
    if (!nuevoUsuario.email.trim() || !nuevoUsuario.nombre.trim() || !nuevoUsuario.password) return;
    await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${obtenerToken()}` },
      body: JSON.stringify(nuevoUsuario),
    });
    setNuevoUsuario({ email: '', nombre: '', password: '', rol: 'SUPERVISOR' });
    cargar();
  }

  async function eliminarUsuario(id: string) {
    if (!confirm('¿Eliminar usuario?')) return;
    await fetch(`/api/usuarios/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${obtenerToken()}` },
    });
    cargar();
  }

  async function guardarEdicion() {
    if (!editando) return;
    await fetch(`/api/usuarios/${editando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${obtenerToken()}` },
      body: JSON.stringify({ nombre: editando.nombre, email: editando.email, rol: editando.rol }),
    });
    setEditando(null);
    cargar();
  }

  async function asignarObra() {
    if (!asignacion.usuarioId || !asignacion.obraId) return;
    try {
      const res = await fetch('/api/usuarios/asignar-obra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${obtenerToken()}` },
        body: JSON.stringify(asignacion),
      });
      if (!res.ok) throw new Error('No se pudo asignar la obra');
      setAsignacion({ usuarioId: '', obraId: '' });
      alert('Obra asignada correctamente');
    } catch (err) {
      alert('Error en el servidor al realizar la asignación.');
    }
  }

  if (cargando) return <p className="text-gray-500 p-4">Cargando control de usuarios...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Usuarios</h1>

      <div className="bg-white border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Nuevo usuario</h2>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Nombre" className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })} />
          <input placeholder="Email" className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={nuevoUsuario.email} onChange={e => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })} />
          <input placeholder="Contraseña" type="password" className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={nuevoUsuario.password} onChange={e => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })} />
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <button onClick={crearUsuario}
            className="col-span-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
            + Crear usuario
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Asignar obra a supervisor</h2>
        <div className="grid grid-cols-2 gap-3">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={asignacion.usuarioId} onChange={e => setAsignacion({ ...asignacion, usuarioId: e.target.value })}>
            <option value="">Seleccionar supervisor</option>
            {usuarios.filter(u => u.rol === 'SUPERVISOR').map(u => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={asignacion.obraId} onChange={e => setAsignacion({ ...asignacion, obraId: e.target.value })}>
            <option value="">Seleccionar obra</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </select>
          <button onClick={asignarObra}
            className="col-span-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
            Asignar obra
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 text-gray-600">Email</th>
              <th className="text-left px-4 py-3 text-gray-600">Rol</th>
              <th className="text-right px-4 py-3 text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editando?.id === u.id
                    ? <input className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                        value={editando.nombre} onChange={e => setEditando(prev => prev ? { ...prev, nombre: e.target.value } : null)} />
                    : u.nombre}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {editando?.id === u.id
                    ? <input className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                        value={editando.email} onChange={e => setEditando(prev => prev ? { ...prev, email: e.target.value } : null)} />
                    : u.email}
                </td>
                <td className="px-4 py-3">
                  {editando?.id === u.id
                    ? <select className="border border-gray-300 rounded px-2 py-1 text-sm"
                        value={editando.rol} onChange={e => setEditando(prev => prev ? { ...prev, rol: e.target.value } : null)}>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    : <span className={`text-xs px-2 py-1 rounded-full ${u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.rol}
                      </span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {editando?.id === u.id ? (
                    <div className="flex gap-2 justify-end">
                      <button onClick={guardarEdicion} className="text-green-600 hover:text-green-800 text-xs font-medium">Guardar</button>
                      <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600 text-xs">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditando(u)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Editar</button>
                      <button onClick={() => eliminarUsuario(u.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}