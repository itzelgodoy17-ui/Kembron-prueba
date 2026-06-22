import { PrismaClient, Rol, EstadoObra, TipoModificacion, CategoriaGasto } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Limpiando base de datos anterior...');
  await prisma.registroAvance.deleteMany();
  await prisma.programacionSemanal.deleteMany();
  await prisma.gasto.deleteMany();
  await prisma.adicionalDeductivo.deleteMany();
  await prisma.item.deleteMany();
  await prisma.titulo.deleteMany();
  await prisma.asignacionObra.deleteMany();
  await prisma.obra.deleteMany();
  await prisma.usuario.deleteMany();

  console.log('🌱 Creando usuarios de prueba...');
  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@kembron.com',
      nombre: 'Carlos Admin',
      passwordHash: 'admin123', 
      rol: Rol.ADMINISTRADOR,
    },
  });

  const supervisor1 = await prisma.usuario.create({
    data: {
      email: 'sup1@kembron.com',
      nombre: 'Juan Supervisor',
      passwordHash: 'super123',
      rol: Rol.SUPERVISOR,
    },
  });

  const supervisor2 = await prisma.usuario.create({
    data: {
      email: 'sup2@kembron.com',
      nombre: 'Ana Supervisora',
      passwordHash: 'super123',
      rol: Rol.SUPERVISOR,
    },
  });

  console.log('🏗️ Creando obras...');
  const obraCompleta = await prisma.obra.create({
    data: {
      nombre: 'Edificio Las Tipas',
      ubicacion: 'Av. Corrientes 1500, CABA',
      cliente: 'Desarrollos Norte S.A.',
      estado: EstadoObra.EJECUCION,
      activa: true,
      fechaInicio: new Date('2026-05-04'),
      fechaFinTeorica: new Date('2026-06-29'),
    },
  });

  const obraDesactivada = await prisma.obra.create({
    data: {
      nombre: 'Planta Industrial Quilmes',
      ubicacion: 'Ruta 2 Km 40, Quilmes',
      cliente: 'Logística Sur',
      estado: EstadoObra.PAUSADA,
      activa: false,
      fechaInicio: new Date('2026-01-10'),
      fechaFinTeorica: new Date('2026-08-15'),
    },
  });

  console.log('📌 Asignando obras a supervisores...');
  await prisma.asignacionObra.createMany({
    data: [
      { usuarioId: supervisor1.id, obraId: obraCompleta.id },
      { usuarioId: supervisor2.id, obraId: obraDesactivada.id },
    ],
  });

  console.log('🗂️ Cargando títulos e ítems del presupuesto...');
  const tituloEstructuras = await prisma.titulo.create({
    data: { obraId: obraCompleta.id, nombre: '01. Estructuras de Hormigón' },
  });

  const itemBases = await prisma.item.create({
    data: {
      tituloId: tituloEstructuras.id,
      nombre: 'Hormigón para Bases y Cimientos',
      cantidadTotal: 50,
      unidad: 'm3',
      valorUnitario: 120,
    },
  });

  const itemColumnas = await prisma.item.create({
    data: {
      tituloId: tituloEstructuras.id,
      nombre: 'Hormigón para Columnas y Vigas',
      cantidadTotal: 30,
      unidad: 'm3',
      valorUnitario: 150, 
    },
  });

  const tituloArquitectura = await prisma.titulo.create({
    data: { obraId: obraCompleta.id, nombre: '02. Arquitectura y Mampostería' },
  });

  const itemMuros = await prisma.item.create({
    data: {
      tituloId: tituloArquitectura.id,
      nombre: 'Muro de Ladrillo Hueco 18x18x33',
      cantidadTotal: 200,
      unidad: 'm2',
      valorUnitario: 25, 
    },
  });

  console.log('📝 Agregando Adicionales y Deductivos...');
  await prisma.adicionalDeductivo.create({
    data: {
      itemId: itemBases.id,
      tipo: TipoModificacion.ADICIONAL,
      nombre: 'Refuerzo estructural por suelo blando',
      monto: 1500,
    },
  });

  await prisma.adicionalDeductivo.create({
    data: {
      itemId: itemMuros.id,
      tipo: TipoModificacion.DEDUCTIVO,
      nombre: 'Reducción de metros por cambio de plano',
      monto: 500,
    },
  });

  console.log('📅 Programando avance semanal (Planificación física/financiera)...');
  await prisma.programacionSemanal.createMany({
    data: [
      { itemId: itemBases.id, numeroSemana: 1, cantidadPlanificada: 20 },
      { itemId: itemBases.id, numeroSemana: 2, cantidadPlanificada: 20 },
      { itemId: itemBases.id, numeroSemana: 3, cantidadPlanificada: 10 },
    ],
  });

  await prisma.programacionSemanal.createMany({
    data: [
      { itemId: itemColumnas.id, numeroSemana: 3, cantidadPlanificada: 10 },
      { itemId: itemColumnas.id, numeroSemana: 4, cantidadPlanificada: 15 },
      { itemId: itemColumnas.id, numeroSemana: 5, cantidadPlanificada: 5 },
    ],
  });

  await prisma.programacionSemanal.createMany({
    data: [
      { itemId: itemMuros.id, numeroSemana: 5, cantidadPlanificada: 50 },
      { itemId: itemMuros.id, numeroSemana: 6, cantidadPlanificada: 50 },
      { itemId: itemMuros.id, numeroSemana: 7, cantidadPlanificada: 50 },
      { itemId: itemMuros.id, numeroSemana: 8, cantidadPlanificada: 50 },
    ],
  });

  console.log('📈 Registrando Avances Reales (Cargados por Supervisor)...');
  await prisma.registroAvance.createMany({
    data: [
      { itemId: itemBases.id, usuarioId: supervisor1.id, cantidadAvanzada: 18, fecha: new Date('2026-05-08') },
      { itemId: itemBases.id, usuarioId: supervisor1.id, cantidadAvanzada: 22, fecha: new Date('2026-05-15') },
      { itemId: itemColumnas.id, usuarioId: supervisor1.id, cantidadAvanzada: 8, fecha: new Date('2026-05-22') },
    ],
  });

  console.log('💰 Imputando Gastos reales en distintas categorías...');
  await prisma.gasto.createMany({
    data: [
      { itemId: itemBases.id, usuarioId: supervisor1.id, descripcion: 'Compra de Hormigón H21 elaborado', categoria: CategoriaGasto.MATERIAL, monto: 2400, fecha: new Date('2026-05-06') },
      { itemId: itemBases.id, usuarioId: supervisor1.id, descripcion: 'Pago quincena cuadrilla de fundaciones', categoria: CategoriaGasto.MANO_OBRA, monto: 1800, fecha: new Date('2026-05-15') },
      { itemId: itemColumnas.id, usuarioId: supervisor1.id, descripcion: 'Alquiler de camión bomba y encofrados', categoria: CategoriaGasto.EQUIPO, monto: 1200, fecha: new Date('2026-05-20') },
      { itemId: itemMuros.id, usuarioId: supervisor1.id, descripcion: 'Adelanto subcontratista de albañilería', categoria: CategoriaGasto.SUBCONTRATO, monto: 700, fecha: new Date('2026-05-25') },
    ],
  });

  console.log('🏁 ¡Base de datos populada exitosamente con el Seed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });