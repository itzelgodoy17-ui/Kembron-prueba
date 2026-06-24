'use client';
import { useEffect, useState } from 'react';
import { obtenerToken } from '../../../../lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type CurvaData = {
  semana: number;
  valorPlanificadoAcumulado: number;
  avanceFisicoAcumulado: number;
  gastoRealAcumulado: number;
};

export default function CurvasS({ obraId }: { obraId: string }) {
  const [curvas, setCurvas] = useState<CurvaData[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tipo, setTipo] = useState<'fisica' | 'financiera'>('fisica');

  useEffect(() => {
    async function cargar() {
      const res = await fetch(`/api/curvas?obraId=${obraId}`, {
        headers: { Authorization: `Bearer ${obtenerToken()}` },
        cache: 'no-store',
      });
      const json = await res.json();
      setCurvas(json.curvas || []);
      setCargando(false);
    }
    cargar();
  }, [obraId]);

  if (cargando) return <p className="text-sm font-medium text-slate-400 animate-pulse p-4">Cargando curvas...</p>;

  const datos = curvas.map(c => ({
    semana: `Sem ${c.semana}`,
    Planificado: tipo === 'fisica'
      ? Math.round((c as any).porcentajePlanificadoAcumulado || 0) 
      : Math.round(c.valorPlanificadoAcumulado),                  
    Real: tipo === 'fisica'
      ? Math.round((c as any).porcentajeAvanceAcumulado || 0)      
      : Math.round(c.gastoRealAcumulado),                         
  }));

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-800">Curva S de Control</h2>
          <p className="text-xs text-slate-400 font-medium">Comparativa de avance acumulado teórico vs. real</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setTipo('fisica')}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
              tipo === 'fisica' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Física (%)
          </button>
          <button
            onClick={() => setTipo('financiera')}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
              tipo === 'financiera' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Financiera ($)
          </button>
        </div>
      </div>

      <div className="w-full pr-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={datos} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="semana" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
              labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
            <Line
              type="monotone"
              dataKey="Planificado"
              stroke="#94a3b8"
              strokeWidth={2.5}
              dot={false}
              strokeDasharray="6 4"
            />
            <Line
              type="monotone"
              dataKey="Real"
              stroke={tipo === 'fisica' ? '#10b981' : '#0284c7'}
              strokeWidth={3}
              dot={{ r: 3, strokeWidth: 1 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}