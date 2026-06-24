'use client';
import { useRouter } from 'next/navigation';
import { eliminarToken, obtenerUsuario } from '@/app/lib/auth';
import { useEffect, useState } from 'react';

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<{ nombre: string } | null>(null);
  const [comprobando, setComprobando] = useState(true);

  useEffect(() => {
    const user = obtenerUsuario();
    if (!user) {
      router.push('/');
    } else {
      setUsuario(user);
      setComprobando(false);
    }
  }, [router]);

  function cerrarSesion() {
    eliminarToken();
    router.push('/');
  }

  if (comprobando) {
    return <p className="text-gray-500 text-center mt-12 text-sm">Verificando sesión...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Celular */}
      <header className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="font-bold text-base tracking-wide">Kembron</h1>
          <p className="text-gray-400 text-xs">{usuario?.nombre}</p>
        </div>
        <button 
          onClick={cerrarSesion} 
          className="text-gray-400 text-sm hover:text-white transition-colors px-2 py-1 rounded active:bg-gray-800"
        >
          Salir
        </button>
      </header>
      
      <main className="p-4 max-w-lg mx-auto">
        {children}
      </main>
    </div>
  );
}