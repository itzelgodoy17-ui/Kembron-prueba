import { prisma } from '../config/prisma';
import { Obra, Titulo, Item, AdicionalDeductivo, Gasto, ProgramacionSemanal, EstadoObra, TipoModificacion, CategoriaGasto, Rol } from '@prisma/client';

type ItemConRelaciones = Item & {
  programaciones: ProgramacionSemanal[];
  avances: any[]; 
  gastos: Gasto[];
  modificaciones: AdicionalDeductivo[];
};

type TituloConRelaciones = Titulo & {
  items: ItemConRelaciones[];
};

type ObraConRelaciones = Obra & {
  titulos: TituloConRelaciones[];
};

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

  async obtenerCurvasObra(obraId: string) {
    const obra = await prisma.obra.findUnique({
      where: { id: obraId },
      include: {
        titulos: {
          include: {
            items: {
              include: {
                programaciones: true,
                avances: true,
                gastos: true,
                modificaciones: true,
              }
            }
          }
        }
      }
    }) as unknown as ObraConRelaciones;

    if (!obra) throw new Error('Obra no encontrada');

    const semanas = Array.from({ length: 8 }, (_, i) => ({
      semana: i + 1,
      valorPlanificadoSemanal: 0,
      valorPlanificadoAcumulado: 0,
      avanceFisicoSemanal: 0,
      avanceFisicoAcumulado: 0,
      gastoRealSemanal: 0,
      gastoRealAcumulado: 0,
    }));

    let acumuladoPlanificado = 0;
    let acumuladoAvance = 0;
    let acumuladoGasto = 0;

    for (const titulo of obra.titulos) {
      for (const item of titulo.items) {
        const valorUnitario = item.valorUnitario;

        for (const prog of item.programaciones) {
          const costoPlanificado = prog.cantidadPlanificada * valorUnitario;
          if (prog.numeroSemana >= 1 && prog.numeroSemana <= 8) {
            semanas[prog.numeroSemana - 1].valorPlanificadoSemanal += costoPlanificado;
          }
        }

        for (const avance of item.avances) {
          const semanaAvance = this.calcularSemanaPorFecha(obra.fechaInicio, avance.fecha);
          const costoAvance = avance.cantidadAvanzada * valorUnitario;
          if (semanaAvance >= 1 && semanaAvance <= 8) {
            semanas[semanaAvance - 1].avanceFisicoSemanal += costoAvance;
          }
        }

        for (const gasto of item.gastos) {
          const semanaGasto = this.calcularSemanaPorFecha(obra.fechaInicio, gasto.fecha);
          if (semanaGasto >= 1 && semanaGasto <= 8) {
            semanas[semanaGasto - 1].gastoRealSemanal += gasto.monto;
          }
        }
      }
    }

    const curvasProcesadas = semanas.map((sem) => {
      acumuladoPlanificado += sem.valorPlanificadoSemanal;
      acumuladoAvance += sem.avanceFisicoSemanal;
      acumuladoGasto += sem.gastoRealSemanal;

      return {
        ...sem,
        valorPlanificadoAcumulado: acumuladoPlanificado,
        avanceFisicoAcumulado: acumuladoAvance,
        gastoRealAcumulado: acumuladoGasto,
      };
    });

    return {
      obraNombre: obra.nombre,
      curvas: curvasProcesadas,
    };
  }

  private calcularSemanaPorFecha(fechaInicioObra: Date, fechaRegistro: Date): number {
    const diffInMs = new Date(fechaRegistro).getTime() - new Date(fechaInicioObra).getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return Math.floor(diffInDays / 7) + 1;
  }

  async crearObra(data: {
    nombre: string;
    ubicacion: string;
    cliente: string;
    estado: EstadoObra;
    activa: boolean;
    fechaInicio: Date;
    fechaFinTeorica: Date;
  }) {
    return await prisma.obra.create({ data });
  }
  
  async editarObra(id: string, data: Partial<{
    nombre: string;
    ubicacion: string;
    cliente: string;
    estado: EstadoObra;
    activa: boolean;
    fechaInicio: Date;
    fechaFinTeorica: Date;
  }>) {
    return await prisma.obra.update({ where: { id }, data });
  }
  
  async desactivarObra(id: string) {
    return await prisma.obra.update({ where: { id }, data: { activa: false } });
  }
  
  async crearTitulo(obraId: string, nombre: string) {
    return await prisma.titulo.create({ data: { obraId, nombre } });
  }
  
  async crearItem(data: {
    tituloId: string;
    nombre: string;
    cantidadTotal: number;
    unidad: string;
    valorUnitario: number;
  }) {
    return await prisma.item.create({ data });
  }
  
  async crearAdicionalDeductivo(data: {
    itemId: string;
    tipo: TipoModificacion;
    nombre: string;
    monto: number;
  }) {
    return await prisma.adicionalDeductivo.create({ data });
  }
  
  async registrarAvance(data: {
    itemId: string;
    usuarioId: string;
    cantidadAvanzada: number;
    fecha: Date;
  }) {
    return await prisma.registroAvance.create({ data });
  }
  
  async registrarGasto(data: {
    itemId: string;
    usuarioId: string;
    descripcion: string;
    categoria: CategoriaGasto;
    monto: number;
    fecha: Date;
  }) {
    return await prisma.gasto.create({ data });
  }
  
  async guardarProgramacion(itemId: string, semanas: { numeroSemana: number; cantidadPlanificada: number }[]) {
    await prisma.programacionSemanal.deleteMany({ where: { itemId } });
    return await prisma.programacionSemanal.createMany({
      data: semanas.map(s => ({ itemId, ...s }))
    });
  }
  
  async obtenerUsuarios() {
    return await prisma.usuario.findMany({ select: { id: true, email: true, nombre: true, rol: true, createdAt: true } });
  }
  
  async crearUsuario(data: { email: string; password: string; nombre: string; rol: Rol }) {
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(data.password, 10);
    return await prisma.usuario.create({ data: { ...data, password: passwordHash } });
  }
  
  async editarUsuario(id: string, data: Partial<{ email: string; nombre: string; rol: Rol }>) {
    return await prisma.usuario.update({ where: { id }, data });
  }
  
  async eliminarUsuario(id: string) {
    return await prisma.usuario.delete({ where: { id } });
  }
  
  async asignarObraASupervisor(usuarioId: string, obraId: string) {
    return await prisma.asignacionObra.create({ data: { usuarioId, obraId } });
  }
  
  async obtenerObrasDeUsuario(usuarioId: string) {
    const asignaciones = await prisma.asignacionObra.findMany({
      where: { usuarioId },
      include: { obra: true }
    });
    return asignaciones.map(a => a.obra);
  }

  async obtenerObraDetalle(id: string) {
    return await prisma.obra.findUnique({
      where: { id },
      include: {
        titulos: {
          include: {
            items: {
              include: {
                modificaciones: true,
                gastos: true,
                programaciones: true,
                avances: true,
              }
            }
          }
        },
        asignaciones: {
          include: { usuario: { select: { id: true, nombre: true, email: true } } }
        }
      }
    });
  }
  
  async obtenerAvancesObra(obraId: string) {
    return await prisma.registroAvance.findMany({
      where: { item: { titulo: { obraId } } },
      include: {
        item: { include: { titulo: true } },
        usuario: { select: { id: true, nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });
  }
  
  async obtenerGastosObra(obraId: string) {
    return await prisma.gasto.findMany({
      where: { item: { titulo: { obraId } } },
      include: {
        item: { include: { titulo: true } },
        usuario: { select: { id: true, nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });
  }
}