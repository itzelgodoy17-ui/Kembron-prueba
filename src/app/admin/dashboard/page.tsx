'use client';
import { useEffect, useState } from 'react';
import { obtenerToken } from '@/app/lib/auth';
import { Building2, BarChart3, TrendingUp, DollarSign, AlertCircle, FolderGit2, PieChart } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar} from 'recharts';

type ObraMetrica = {
  id: string;
  nombre: string;
  presupuestoReal: number;
  totalGastado: number;
};

type DashboardData = {
  totalObras: number;
  obrasActivas: number;
  obrasInactivas: number;
  presupuestoTeoricoGlobal: number;
  presupuestoRealGlobal: number;
  totalGastadoGlobal: number;
  desvioGlobal: number;
  obrasDetalle: ObraMetrica[]; 
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDashboard() {
      try {
        const res = await fetch('/api/dashboard', {
          headers: { Authorization: `Bearer ${obtenerToken()}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
      } finally {
        setCargando(false);
      }
    }
    cargarDashboard();
  }, []);

  if (cargando || !data || data.presupuestoTeoricoGlobal === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm font-semibold text-slate-400 animate-pulse tracking-wide">
          Procesando tableros de control global...
        </p>
      </div>
    );
  }

  const tarjetas = [
    {
      label: 'Obras Activas',
      valor: data.obrasActivas,
      icon: Building2,
      bgIcon: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Obras Inactivas',
      valor: data.obrasInactivas,
      icon: FolderGit2,
      bgIcon: 'bg-rose-50 text-rose-600',
    },
    {
      label: 'Total de Proyectos',
      valor: data.totalObras,
      icon: PieChart,
      bgIcon: 'bg-slate-100 text-slate-700',
    },
    {
      label: 'Presupuesto Teórico',
      valor: `$${data.presupuestoTeoricoGlobal.toLocaleString('es-AR')}`,
      icon: BarChart3,
      bgIcon: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Presupuesto Real (Modificado)',
      valor: `$${data.presupuestoRealGlobal.toLocaleString('es-AR')}`,
      icon: DollarSign,
      bgIcon: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Total Ejecutado (Gastos)',
      valor: `$${data.totalGastadoGlobal.toLocaleString('es-AR')}`,
      icon: TrendingUp,
      bgIcon: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Dashboard General</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Estado financiero consolidador y control presupuestario de obras en tiempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tarjetas.map((t) => {
          const Icono = t.icon;
          return (
            <div 
              key={t.label} 
              className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md"
            >
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.label}</p>
                <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{t.valor}</h3>
              </div>
              <div className={`p-3 rounded-xl shrink-0 ${t.bgIcon}`}>
                <Icono className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800 tracking-tight flex items-center gap-2">
              <AlertCircle className={`w-5 h-5 ${data.desvioGlobal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
              Balance de Desvío Global
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Cálculo de control de balance de recursos: (Presupuesto Real Total - Total Ejecutado).
            </p>
          </div>
          <span className={`text-xs px-3.5 py-2 rounded-full font-semibold self-start sm:self-center border ${
            data.desvioGlobal >= 0 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {data.desvioGlobal >= 0 ? '✓ Dentro del Presupuesto' : '⚠ Saldo Excedido'}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Balance de Caja</p>
          <p className={`text-3xl font-extrabold tracking-tight ${data.desvioGlobal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ${data.desvioGlobal.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">Análisis Económico Global</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Comparativa visual entre el presupuesto modificado (real) y los gastos totales acumulados de la empresa.
          </p>
        </div>
        
        <div className="space-y-4">
          {(() => {
            const presupuestoReal = data.presupuestoRealGlobal || 0;
            const totalGastado = data.totalGastadoGlobal || 0;
            
            const porcentaje = presupuestoReal > 0 
              ? Math.min(100, (totalGastado / presupuestoReal) * 100) 
              : 0;
            
            const estaExcedido = totalGastado > presupuestoReal;
      
            return (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-1">
                  <span className="font-semibold text-gray-800 tracking-tight">Ejecución Presupuestaria Total</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <span>Gastado: <strong className="text-gray-800">${totalGastado.toLocaleString('es-AR')}</strong></span>
                    <span className="text-gray-300">|</span>
                    <span>Presupuesto Real: <strong className="text-gray-800">${presupuestoReal.toLocaleString('es-AR')}</strong></span>
                  </div>
                </div>
      
                <div className="w-full bg-gray-100 h-6 rounded-xl overflow-hidden relative shadow-inner flex items-center">
                  <div 
                    style={{ width: `${porcentaje}%` }}
                    className={`h-full transition-all duration-500 ${
                      estaExcedido 
                        ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                  />
                  
                  <span className={`absolute right-4 text-xs font-bold ${
                    porcentaje > 85 ? 'text-white' : 'text-gray-700'
                  }`}>
                    {porcentaje.toFixed(1)}% Consumido
                  </span>
                </div>
                
                <p className="text-[11px] text-gray-400 italic">
                  * Este indicador mide el avance financiero consolidado de todos los proyectos activos e inactivos.
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {data.obrasDetalle && data.obrasDetalle.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">Presupuestado vs. Ejecutado por Obra</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Comparativa entre el presupuesto real y el total gastado por cada proyecto.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.obrasDetalle} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600' }}
                formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')}`, '']}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
              <Bar dataKey="presupuestoReal" name="Presupuestado" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalGastado" name="Ejecutado" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}