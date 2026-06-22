import { prisma } from '../config/prisma';
import { Obra } from '@prisma/client';

export class ObraService {
  
  async obtenerTodasLasObras(): Promise<Obra[]> {
    return await prisma.obra.findMany();
  }

  async obtenerDashboardGlobal(): Promise<{
    totalObras: number;
    obrasActivas: number;
    obrasInactivas: number;
    presupuestoTeoricoGlobal: number;
    presupuestoRealGlobal: number;
    totalGastadoGlobal: number;
    desvioGlobal: number;
   }> {
    const obras = await prisma.obra.findMany({
      include: {
        titulos: {
          include: {
            items: {
              include: {
                modificaciones: true,
                gastos: true
              }
            }
          }
        }
      }
    });

    const totalObras = obras.length;
    const obrasActivas = obras.filter((o) => o.activa).length;
    let presupuestoTeoricoGlobal: number = 0;
    let presupuestoRealGlobal: number = 0;
    let totalGastadoGlobal: number = 0;

    for (const obra of obras) {
      for (const titulo of obra.titulos) {
        for (const item of titulo.items) {
          
          const itemTeorico = item.cantidadTotal * item.valorUnitario;
          presupuestoTeoricoGlobal += itemTeorico;

          const adicionales = item.modificaciones
            .filter((m) => m.tipo === 'ADICIONAL')
            .reduce((sum: number, m) => sum + m.monto, 0); 

          const deductivos = item.modificaciones
            .filter((m) => m.tipo === 'DEDUCTIVO')
            .reduce((sum: number, m) => sum + m.monto, 0); 
          
          presupuestoRealGlobal += (itemTeorico + adicionales - deductivos);

          const itemGastado = item.gastos.reduce((sum: number, g) => sum + g.monto, 0);
          totalGastadoGlobal += itemGastado;
        }
      }
    }

    return {
      totalObras,
      obrasActivas,
      obrasInactivas: totalObras - obrasActivas,
      presupuestoTeoricoGlobal,
      presupuestoRealGlobal,
      totalGastadoGlobal,
      desvioGlobal: presupuestoRealGlobal - totalGastadoGlobal
    };
  }
}