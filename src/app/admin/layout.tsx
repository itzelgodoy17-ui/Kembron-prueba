'use client';
import { usePathname, useRouter } from 'next/navigation';
import { eliminarToken } from '@/app/lib/auth';
import { 
  LayoutDashboard, 
  HardHat, 
  Calculator, 
  TrendingUp, 
  Users, 
  LogOut 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { nombre: 'Dashboard', path: '/admin/dashboard', icono: LayoutDashboard },
    { nombre: 'Obras', path: '/admin/obras', icono: HardHat },
    { nombre: 'Presupuesto', path: '/admin/presupuesto', icono: Calculator },
    { nombre: 'Avance', path: '/admin/avance', icono: TrendingUp },
    { nombre: 'Usuarios', path: '/admin/usuarios', icono: Users },
  ];

  function handleCerrarSesion() {
    eliminarToken();
    router.push('/');
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full z-20 shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-wider text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
            KEMBRON
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Panel de Control</p>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icono = item.icono;
            const activo = pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activo 
                    ? 'bg-blue-600 text-white shadow-md font-semibold' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icono className={`w-5 h-5 ${activo ? 'text-white' : 'text-gray-400'}`} />
                {item.nombre}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleCerrarSesion}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="text-sm text-gray-500 font-medium">
            Bienvenido, <span className="text-gray-800 font-semibold">Administrador</span>
          </div>
          <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-mono">
            Modo Escritorio
          </div>
        </header>

        <main className="p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}