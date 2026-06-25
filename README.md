# Kembron — Sistema de Gestión y Control de Obras

## Stack
- Next.js 15 (App Router)
- PostgreSQL (Neon)
- Prisma ORM
- JWT + bcrypt para autenticación
- Tailwind CSS

## Cómo correr en local

### 1. Clonar el repositorio
git clone <url-del-repo>
cd control-obras-kembron

### 2. Instalar dependencias
npm install

### 3. Configurar variables de entorno
Crear archivo `.env` en la raíz:
DATABASE_URL="postgresql://..."
JWT_SECRET="clave_secreta_super_segura_123"

### 4. Ejecutar migraciones
npx prisma migrate dev --name init

### 5. Cargar datos de ejemplo
npx prisma db seed

### 6. Correr en desarrollo
npm run dev

La app estará disponible en http://localhost:3000

## Credenciales de prueba

### Administrador
- Email: admin@kembron.com
- Password: admin123

### Supervisor 1
- Email: sup1@kembron.com
- Password: super123

### Supervisor 2
- Email: sup2@kembron.com
- Password: super123

## Variables de entorno requeridas
- DATABASE_URL — URL de conexión a PostgreSQL (Neon)
- JWT_SECRET — Clave secreta para firmar tokens JWT

## Deploy
La aplicación está deployada en Vercel:
https://kembron-prueba-t8wr.vercel.app/
