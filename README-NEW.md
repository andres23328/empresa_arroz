# Sistema de Gestión de Empleados - Molino de Arroz

Sistema completo de gestión de empleados y contratos para un molino de arroz, migrado de Supabase a Firebase Firestore con backend Express.

## 🏗️ Arquitectura

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + Node.js
- **Base de Datos**: Firebase Firestore (NoSQL)
- **Autenticación**: JWT + bcryptjs
- **Deploy**: Railway

## 📁 Estructura del Proyecto

```
├── backend/                 # Backend Express
│   ├── src/
│   │   ├── config/         # Configuración Firebase
│   │   ├── middleware/     # Middleware de autenticación y errores
│   │   ├── routes/         # Rutas API
│   │   └── index.js        # Servidor principal
│   ├── package.json
│   ├── Dockerfile
│   └── env.example
├── src/                    # Frontend React
│   ├── components/         # Componentes UI
│   ├── integrations/       # Configuración Firebase
│   ├── pages/             # Páginas de la aplicación
│   └── ...
├── railway.toml           # Configuración Railway
├── Dockerfile.frontend    # Docker para frontend
└── nginx.conf             # Configuración Nginx
```

## 🚀 Configuración y Instalación

### 1. Configurar Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Firestore Database
3. Generar una Service Account Key:
   - Ve a Project Settings > Service Accounts
   - Genera una nueva clave privada
   - Descarga el archivo JSON

### 2. Configurar Variables de Entorno

#### Backend (backend/env.example)
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

#### Frontend (env.example)
```env
VITE_API_URL=http://localhost:3001/api
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Instalación Local

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
npm install
npm run dev
```

## 🗄️ Estructura de Base de Datos (Firestore)

### Colecciones Principales

#### `users` (Colección)
```javascript
{
  id: "user_id",
  email: "user@example.com",
  fullName: "Nombre Usuario",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `users/{userId}/passwords` (Subcolección)
```javascript
{
  id: "password_id",
  password: "hashed_password",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `employees` (Colección)
```javascript
{
  id: "employee_id",
  nro_documento: "12345678",
  nombre: "Juan",
  apellido: "Pérez",
  edad: 30,
  genero: "Masculino",
  cargo: "Operario de Molino",
  correo: "juan@molino.com",
  nro_contacto: "3001234567",
  estado: "Activo",
  observaciones: "Observaciones...",
  createdBy: "user_id",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `contracts` (Colección)
```javascript
{
  id: "contract_id",
  employeeId: "employee_id",
  fecha_inicio: "2024-01-01",
  fecha_fin: "2024-12-31",
  valor_contrato: 2500000,
  createdBy: "user_id",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🔧 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Obtener usuario actual

### Empleados
- `GET /api/employees` - Listar empleados
- `GET /api/employees/:id` - Obtener empleado
- `POST /api/employees` - Crear empleado
- `PUT /api/employees/:id` - Actualizar empleado
- `DELETE /api/employees/:id` - Eliminar empleado

### Contratos
- `GET /api/contracts` - Listar contratos
- `GET /api/contracts/:id` - Obtener contrato
- `GET /api/contracts/employee/:employeeId` - Contratos por empleado
- `POST /api/contracts` - Crear contrato
- `PUT /api/contracts/:id` - Actualizar contrato
- `DELETE /api/contracts/:id` - Eliminar contrato

## 🚀 Deploy en Railway

### 1. Preparar el Proyecto

1. Subir el código a GitHub
2. Conectar Railway con tu repositorio

### 2. Configurar Variables de Entorno en Railway

#### Backend Service
- `NODE_ENV`: `production`
- `PORT`: `3001`
- `FRONTEND_URL`: `https://tu-frontend.railway.app`
- `JWT_SECRET`: Tu clave secreta JWT
- `FIREBASE_PROJECT_ID`: Tu project ID de Firebase
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Tu service account key JSON

#### Frontend Service
- `VITE_API_URL`: `https://tu-backend.railway.app/api`
- `VITE_FIREBASE_API_KEY`: Tu API key de Firebase
- `VITE_FIREBASE_AUTH_DOMAIN`: Tu auth domain
- `VITE_FIREBASE_PROJECT_ID`: Tu project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Tu storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Tu messaging sender ID
- `VITE_FIREBASE_APP_ID`: Tu app ID

### 3. Deploy

Railway detectará automáticamente los Dockerfiles y desplegará ambos servicios.

## 🔐 Seguridad

- Autenticación JWT con tokens de 24 horas
- Contraseñas hasheadas con bcryptjs
- Rate limiting en el backend
- Headers de seguridad con Helmet
- Validación de datos con express-validator
- CORS configurado para el frontend

## 📝 Características

- ✅ Sistema de autenticación completo
- ✅ Gestión de empleados (CRUD)
- ✅ Gestión de contratos (CRUD)
- ✅ Interfaz moderna con shadcn/ui
- ✅ Responsive design
- ✅ Validación de formularios
- ✅ Manejo de errores
- ✅ Exportación de datos
- ✅ Búsqueda y filtros
- ✅ Deploy en Railway

## 🛠️ Tecnologías Utilizadas

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- React Hook Form
- Lucide React (iconos)

### Backend
- Node.js
- Express.js
- Firebase Admin SDK
- JWT
- bcryptjs
- express-validator
- CORS
- Helmet

### Base de Datos
- Firebase Firestore
- Colecciones y subcolecciones
- Queries optimizadas

### Deploy
- Railway
- Docker
- Nginx

## 📞 Soporte

Para soporte o preguntas sobre el proyecto, contacta al equipo de desarrollo.

---

**Nota**: Asegúrate de cambiar todas las claves secretas y configuraciones por defecto antes de usar en producción.


