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

    let presupuestoTotalObra = 0;
    for (const titulo of obra.titulos) {
      for (const item of titulo.items) {
        const itemTeorico = item.cantidadTotal * item.valorUnitario;
        const adicionales = item.modificaciones
          ? item.modificaciones.filter((m) => m.tipo === 'ADICIONAL').reduce((sum, m) => sum + m.monto, 0)
          : 0;
        const deductivos = item.modificaciones
          ? item.modificaciones.filter((m) => m.tipo === 'DEDUCTIVO').reduce((sum, m) => sum + m.monto, 0)
          : 0;
        presupuestoTotalObra += (itemTeorico + adicionales - deductivos);
      }
    }

    const fechaInicio = new Date(obra.fechaInicio);
    const fechaFin = new Date(obra.fechaFinTeorica);
    const diffInMs = fechaFin.getTime() - fechaInicio.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    const totalSemanas = Math.max(1, Math.ceil(diffInDays / 7));

    const semanas = Array.from({ length: totalSemanas }, (_, i) => ({
      semana: i + 1,
      valorPlanificadoSemanal: 0,
      valorPlanificadoAcumulado: 0,
      avanceFisicoSemanal: 0,
      avanceFisicoAcumulado: 0,
      gastoRealSemanal: 0,
      gastoRealAcumulado: 0,
    }));

    for (const titulo of obra.titulos) {
      for (const item of titulo.items) {
        const valorUnitario = item.valorUnitario;

        for (const prog of item.programaciones) {
          const costoPlanificado = prog.cantidadPlanificada * valorUnitario;
          if (prog.numeroSemana >= 1 && prog.numeroSemana <= totalSemanas) {
            semanas[prog.numeroSemana - 1].valorPlanificadoSemanal += costoPlanificado;
          }
        }

        for (const avance of item.avances) {
          const semanaAvance = this.calcularSemanaPorFecha(obra.fechaInicio, avance.fecha);
          const costoAvance = avance.cantidadAvanzada * valorUnitario;
          if (semanaAvance >= 1 && semanaAvance <= totalSemanas) {
            semanas[semanaAvance - 1].avanceFisicoSemanal += costoAvance;
          }
        }

        for (const gasto of item.gastos) {
          const semanaGasto = this.calcularSemanaPorFecha(obra.fechaInicio, gasto.fecha);
          if (semanaGasto >= 1 && semanaGasto <= totalSemanas) {
            semanas[semanaGasto - 1].gastoRealSemanal += gasto.monto;
          }
        }
      }
    }

    let acumuladoPlanificado = 0;
    let acumuladoAvance = 0;
    let acumuladoGasto = 0;

    const curvasProcesadas = semanas.map((sem) => {
      acumuladoPlanificado += sem.valorPlanificadoSemanal;
      acumuladoAvance += sem.avanceFisicoSemanal;
      acumuladoGasto += sem.gastoRealSemanal;

      return {
        ...sem,
        valorPlanificadoAcumulado: acumuladoPlanificado,
        avanceFisicoAcumulado: acumuladoAvance,
        gastoRealAcumulado: acumuladoGasto,
        porcentajePlanificadoAcumulado: presupuestoTotalObra > 0 
          ? (acumuladoPlanificado / presupuestoTotalObra) * 100 
          : 0,
        porcentajeAvanceAcumulado: presupuestoTotalObra > 0 
          ? (acumuladoAvance / presupuestoTotalObra) * 100 
          : 0,
      };
    });

    return {
      obraNombre: obra.nombre,
      presupuestoTotal: presupuestoTotalObra,
      curvas: curvasProcesadas,
    };
  }

  private calcularSemanaPorFecha(fechaInicioObra: Date, fechaRegistro: Date): number {
  const inicio = new Date(fechaInicioObra);
  const registro = new Date(fechaRegistro);

  const inicioMs = Date.UTC(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const registroMs = Date.UTC(registro.getFullYear(), registro.getMonth(), registro.getDate());

  const diffInDays = (registroMs - inicioMs) / (1000 * 60 * 60 * 24);

  if (diffInDays < 0) return -1;
  return Math.floor(diffInDays / 7) + 1;
}

  async crearObra(data: any) {
  return await prisma.obra.create({
    data: {
      nombre: data.nombre,
      ubicacion: data.ubicacion,
      cliente: data.cliente,
      estado: data.estado,
      activa: data.activa,
      fechaInicio: new Date(data.fechaInicio),
      fechaFinTeorica: new Date(data.fechaFinTeorica),
    }
  });
}
  
  async editarObra(id: string, data: any) {
  const updateData: any = {};
  
  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.ubicacion !== undefined) updateData.ubicacion = data.ubicacion;
  if (data.cliente !== undefined) updateData.cliente = data.cliente;
  if (data.estado !== undefined) updateData.estado = data.estado;
  if (data.activa !== undefined) updateData.activa = data.activa;
  if (data.fechaInicio) updateData.fechaInicio = new Date(data.fechaInicio);
  if (data.fechaFinTeorica) updateData.fechaFinTeorica = new Date(data.fechaFinTeorica);
  
  const resultado = await prisma.obra.update({
    where: { id },
    data: updateData,
  });
  
  return resultado;
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
    fecha: string | Date;
  }) {
    const item = await prisma.item.findUnique({
      where: { id: data.itemId },
      include: { avances: true }
    });

    if (!item) throw new Error('El ítem especificado no existe.');

    const cantidadAnterior = item.avances.reduce((sum, a) => sum + a.cantidadAvanzada, 0);
    const nuevoTotalSuma = cantidadAnterior + data.cantidadAvanzada;

    if (nuevoTotalSuma > item.cantidadTotal) {
      throw new Error(
        `Límite superado. El ítem ya tiene ${cantidadAnterior} ${item.unidad} avanzados de un total presupuestado de ${item.cantidadTotal} ${item.unidad}. No podés cargar ${data.cantidadAvanzada}.`
      );
    }

    return await prisma.registroAvance.create({
      data: {
        itemId: data.itemId,
        usuarioId: data.usuarioId,
        cantidadAvanzada: data.cantidadAvanzada,
        fecha: new Date(data.fecha)
      }
    });
  }
  
  async registrarGasto(data: {
  itemId: string;
  usuarioId: string;
  descripcion: string;
  categoria: CategoriaGasto;
  monto: number;
  fecha: string | Date;
}) {
  return await prisma.gasto.create({ 
    data: {
      itemId: data.itemId,
      usuarioId: data.usuarioId,
      descripcion: data.descripcion,
      categoria: data.categoria,
      monto: Number(data.monto),      
      fecha: new Date(data.fecha)       
    }
  });
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
  try {
    return await prisma.asignacionObra.create({ data: { usuarioId, obraId } });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Este supervisor ya tiene esa obra asignada');
    }
    throw error;
  }
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

  async obtenerResumenObra(obraId: string) {
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
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
      }
    }
  });

  if (!obra) throw new Error('Obra no encontrada');

  const hoy = new Date();
  const diasTranscurridos = Math.floor((hoy.getTime() - new Date(obra.fechaInicio).getTime()) / (1000 * 60 * 60 * 24));
  const duracionTotal = Math.floor((new Date(obra.fechaFinTeorica).getTime() - new Date(obra.fechaInicio).getTime()) / (1000 * 60 * 60 * 24));
  const porcentajeTiempo = Math.min(100, Math.round((diasTranscurridos / duracionTotal) * 100));

  let presupuestoTeorico = 0;
  let presupuestoReal = 0;
  let totalEjecutado = 0;
  const resumenTitulos = [];
  const avancesPorItem: number[] = [];

  for (const titulo of obra.titulos) {
    const avancesPorItemEnTitulo: number[] = [];
    let presupuestoTeoricoTitulo = 0;
    let presupuestoRealTitulo = 0;
    let ejecutadoTitulo = 0;

    for (const item of titulo.items) {
      const teorico = item.cantidadTotal * item.valorUnitario;
      presupuestoTeoricoTitulo += teorico;

      const adicionales = item.modificaciones
        .filter(m => m.tipo === 'ADICIONAL')
        .reduce((sum, m) => sum + m.monto, 0);
      const deductivos = item.modificaciones
        .filter(m => m.tipo === 'DEDUCTIVO')
        .reduce((sum, m) => sum + m.monto, 0);
      const real = teorico + adicionales - deductivos;
      presupuestoRealTitulo += real;

      const ejecutadoItem = item.gastos.reduce((sum, g) => sum + g.monto, 0);
      ejecutadoTitulo += ejecutadoItem;

      const cantidadAvanzada = item.avances.reduce((sum: number, a: any) => sum + a.cantidadAvanzada, 0);
      const avanceFisicoItem = Math.min(100, (cantidadAvanzada / item.cantidadTotal) * 100);
      avancesPorItemEnTitulo.push(avanceFisicoItem);
      avancesPorItem.push(avanceFisicoItem);
    }

    const avanceTitulo = avancesPorItemEnTitulo.length > 0
      ? avancesPorItemEnTitulo.reduce((a, b) => a + b, 0) / avancesPorItemEnTitulo.length
      : 0;

    presupuestoTeorico += presupuestoTeoricoTitulo;
    presupuestoReal += presupuestoRealTitulo;
    totalEjecutado += ejecutadoTitulo;

    resumenTitulos.push({
      id: titulo.id,
      nombre: titulo.nombre,
      avanceFisico: Math.round(avanceTitulo * 10) / 10,
      presupuestoTeorico: presupuestoTeoricoTitulo,
      presupuestoReal: presupuestoRealTitulo,
      ejecutado: ejecutadoTitulo,
    });
  }

  const avanceFisicoObra = avancesPorItem.length > 0
    ? avancesPorItem.reduce((a, b) => a + b, 0) / avancesPorItem.length
    : 0;

  const avanceEconomicoObra = presupuestoReal > 0
    ? (totalEjecutado / presupuestoReal) * 100
    : 0;

  return {
    obra: {
      id: obra.id,
      nombre: obra.nombre,
      ubicacion: obra.ubicacion,
      cliente: obra.cliente,
      estado: obra.estado,
      activa: obra.activa,
      fechaInicio: obra.fechaInicio,
      fechaFinTeorica: obra.fechaFinTeorica,
    },
    diasTranscurridos,
    duracionTotal,
    porcentajeTiempo,
    avanceFisicoObra: Math.round(avanceFisicoObra * 10) / 10,
    avanceEconomicoObra: Math.round(avanceEconomicoObra * 10) / 10,
    presupuestoTeorico,
    presupuestoReal,
    totalEjecutado,
    resumenTitulos,
  };
}

  async obtenerProgramacionObra(obraId: string) {
    return await prisma.titulo.findMany({
      where: { obraId },
      include: {
        items: {
          include: {
            programaciones: { orderBy: { numeroSemana: 'asc' } },
            avances: true,
          }
        }
      }
    });
  }

  async obtenerTodasLasObrasConPresupuesto() {
    const obrasRaw = await prisma.obra.findMany({
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
        }
      }
    });

    return obrasRaw.map((obra) => {
      let presupuestoTeorico = 0;
      let presupuestoReal = 0;
      let totalGastado = 0;

      for (const titulo of obra.titulos) {
        for (const item of titulo.items) {
          const teorico = item.cantidadTotal * item.valorUnitario;
          presupuestoTeorico += teorico;

          const adicionales = item.modificaciones
            .filter(m => m.tipo === 'ADICIONAL')
            .reduce((sum, m) => sum + m.monto, 0);

          const deductivos = item.modificaciones
            .filter(m => m.tipo === 'DEDUCTIVO')
            .reduce((sum, m) => sum + m.monto, 0);

          presupuestoReal += (teorico + adicionales - deductivos);
          totalGastado += item.gastos.reduce((sum, g) => sum + g.monto, 0);
        }
      }

      return {
        id: obra.id,
        nombre: obra.nombre,
        ubicacion: obra.ubicacion,
        cliente: obra.cliente,
        estado: obra.estado,
        activa: obra.activa,
        fechaInicio: obra.fechaInicio.toISOString(),        
        fechaFinTeorica: obra.fechaFinTeorica.toISOString(), 
        presupuestoTeorico,
        presupuestoReal,
        totalGastado,
        desvio: presupuestoReal - totalGastado,
      };
    });
  }

async editarTitulo(id: string, nombre: string) {
  return await prisma.titulo.update({
    where: { id },
    data: { nombre }
  });
}

async eliminarTitulo(id: string) {
  await prisma.item.deleteMany({ where: { tituloId: id } });
  return await prisma.titulo.delete({ where: { id } });
}

async editarItem(id: string, data: Partial<{ nombre: string; cantidadTotal: number; unidad: string; valorUnitario: number }>) {
  return await prisma.item.update({
    where: { id },
    data
  });
}

async eliminarItem(id: string) {
  await prisma.programacionSemanal.deleteMany({ where: { itemId: id } });
  await prisma.registroAvance.deleteMany({ where: { itemId: id } });
  await prisma.gasto.deleteMany({ where: { itemId: id } });
  await prisma.adicionalDeductivo.deleteMany({ where: { itemId: id } });
  
  return await prisma.item.delete({ where: { id } });
}

async activarObra(id: string) {
  return await prisma.obra.update({ where: { id }, data: { activa: true } });
}
}