'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { guardarToken } from '@/app/lib/auth'; 

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); 
    if (!email.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setCargando(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Credenciales inválidas');
        return;
      }
      
      guardarToken(data.token);
      
      if (data.usuario?.rol === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/supervisor/obras');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Kembron</h1>
        <p className="text-sm text-gray-500 mb-6">Sistema de Control de Obras</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800"
              placeholder="correo02@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-gray-800 text-white py-2.5 rounded-lg font-medium hover:bg-gray-700 transition disabled:opacity-50 text-sm mt-2"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}