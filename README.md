# Focus App - Pomodoro & Eisenhower Matrix

Una aplicación de productividad construida con Next.js que combina un temporizador Pomodoro con matrices de Eisenhower para priorización de tareas.

## Características

- **Pomodoro Timer**: Temporizador con sesiones de trabajo (25 min), descansos cortos (5 min) y largos (15 min)
- **Priority Matrix**: Matriz de Eisenhower con 4 cuadrantes para organizar tareas por urgencia e importancia
- **Interactive Matrix**: Matriz interactiva con drag & drop libre para posicionar tareas en cualquier coordenada
- **Autenticación**: Login con Google OAuth y email/password via Supabase
- **Auto-logout**: Cierre de sesión automático por inactividad (configurable)
- **Persistencia**: Las posiciones de tareas se guardan en localStorage

## Requisitos

- Node.js 18+
- npm 9+
- Cuenta de Supabase

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd droid-test
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crear archivo `.env.local` en la raíz del proyecto:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   
   # Session timeout in minutes (default: 30)
   NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES=30
   ```

4. **Configurar Supabase**

   En el dashboard de Supabase (https://supabase.com/dashboard):
   
   - Ve a **Settings > API** para obtener la URL y anon key
   - Ve a **Authentication > Providers > Email** y habilítalo
   - (Opcional) Para Google OAuth:
     - Ve a **Authentication > Providers > Google**
     - Configura el Client ID y Secret de Google Cloud Console
     - En **Authentication > URL Configuration**, agrega tu callback URL:
       ```
       http://localhost:3000/auth/callback
       ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```
   
   La aplicación estará disponible en `http://localhost:3000`

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con Turbopack |
| `npm run build` | Genera build de producción |
| `npm run start` | Inicia el servidor de producción |
| `npm run lint` | Ejecuta ESLint |

## Estructura del proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── auth/callback/      # Callback de OAuth
│   ├── interactive-matrix/ # Página de matriz interactiva
│   ├── login/              # Página de login
│   ├── matrix/             # Página de matriz por cuadrantes
│   ├── globals.css         # Estilos globales (Tailwind)
│   ├── layout.tsx          # Layout principal
│   └── page.tsx            # Home (Pomodoro)
├── components/
│   ├── eisenhower/         # Componentes de matriz por cuadrantes
│   ├── interactive-matrix/ # Componentes de matriz interactiva
│   ├── layout/             # Sidebar y AppLayout
│   └── ui/                 # Componentes shadcn/ui
├── lib/
│   ├── supabase/           # Cliente de Supabase (client, server, middleware)
│   └── utils.ts            # Utilidades (cn)
├── providers/
│   ├── auth-provider.tsx   # Contexto de autenticación
│   └── query-provider.tsx  # React Query provider
├── stores/
│   ├── interactive-matrix-store.ts  # Estado de matriz interactiva
│   ├── sidebar-store.ts    # Estado del sidebar
│   └── task-store.ts       # Estado de tareas
├── types/
│   └── task.ts             # Tipos de Task, Tag, Quadrant
└── middleware.ts           # Middleware de autenticación
```

## Tecnologías

- **Framework**: Next.js 16 (App Router)
- **Estilos**: Tailwind CSS v4
- **Componentes UI**: shadcn/ui
- **Autenticación**: Supabase Auth
- **Estado global**: Zustand
- **Data fetching**: TanStack React Query
- **Drag & Drop**: dnd-kit
- **Lenguaje**: TypeScript

## Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase | Sí |
| `NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES` | Minutos de inactividad antes del auto-logout | No (default: 30) |

## Licencia

MIT
