# Qué Morfamos - Dashboard

Panel de monitoreo y análisis para el sistema de recomendaciones gastronómicas Qué Morfamos. Permite visualizar estadísticas de la base de datos, monitorear la actividad de scraping y ejecutar consultas SQL personalizadas.

## Demo en Vivo

El sistema principal está disponible en [quemorfamos.adriandv.dev](https://quemorfamos.adriandv.dev).

## Características

- **Dashboard Principal** - KPIs principales: lugares, reseñas, ratings promedio
- **Estadísticas** - Análisis detallado por zona, barrio, categoría y ratings
- **Monitor de Scraping** - Timeline de actividad, lugares más activos, tendencias
- **Buscador de Reseñas** - Búsqueda de texto completo en +170k reseñas
- **Explorador SQL** - Editor Monaco (VS Code) con consultas predefinidas, de sólo lectura
- **Gestión de Lugares** - Vista detallada de cada restaurante con sus reseñas
- **Mapa Interactivo** - Visualización geográfica con filtros
- **Dark/Light mode** - Toggle de tema
- **Responsive** - Sidebar colapsable para móviles

## Modelo de Acceso a los Datos

El dashboard es de sólo lectura y consulta Supabase directamente desde el cliente con la
`anon key`, que es pública por diseño. Lo que define qué se puede ver no es el frontend, sino la
base:

- **RLS activo** en todas las tablas expuestas, con políticas de sólo lectura.
- **Sin permisos de escritura** para el rol anónimo: `INSERT`, `UPDATE` y `DELETE` están revocados.
- **El Explorador SQL corre como el visitante** (`SECURITY INVOKER`), no como el dueño de la base:
  las mismas reglas de RLS que protegen al resto lo contienen a él. Además tiene timeout de 5s y
  un techo de 1000 filas por consulta.

Los datos expuestos son reseñas públicas de Google Maps; no hay información personal de usuarios
del sistema.

## Contexto del Proyecto

Este desarrollo forma parte de mi portfolio personal, construido para profundizar habilidades en visualización de datos y desarrollo de dashboards. Integra conceptos de:

- Desarrollo de interfaces con Next.js y React
- Visualización de datos con Recharts
- Consumo de bases de datos PostgreSQL vía Supabase
- UX/UI para paneles de administración
- Mapas interactivos con Leaflet

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Framework | Next.js 15 (App Router) |
| UI Components | shadcn/ui |
| Estilos | Tailwind CSS |
| Gráficos | Recharts |
| SQL Editor | Monaco Editor |
| Mapas | Leaflet + React-Leaflet |
| Base de Datos | Supabase (PostgreSQL) |

## Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/AdrianDVnqn/que-morfamos-dashboard.git
cd que-morfamos-dashboard

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev

# Abrir http://localhost:3000
```

## Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

## Estructura del Proyecto

```
src/
├── app/                 # Pages (App Router)
│   ├── page.tsx         # Dashboard principal
│   ├── statistics/      # Estadísticas detalladas
│   ├── lugares/         # Gestión de lugares
│   ├── reviews/         # Buscador de reseñas
│   ├── sql/             # Explorador SQL (sólo lectura)
│   └── logs/            # Logs de scraping
├── components/
│   ├── ui/              # shadcn components
│   ├── dashboard/       # Stats cards, charts
│   ├── Map/             # Componentes de mapa
│   └── places/          # Detalles de lugares
└── lib/
    ├── supabase.ts       # Cliente de DB y tipos del esquema
    ├── scrapingStats.ts  # Series temporales del pipeline (agregado semanal)
    └── reviewAnalyzer.ts # Análisis de texto
```

## Repositorios Relacionados

- **que-morfamos-dashboard** (este repo): Panel de monitoreo
- **que-morfamos**: Backend API FastAPI
- **que-morfamos-web**: Frontend React (chatbot)
- **que-morfamos-scraper**: Pipeline de datos y embeddings

## Disclaimer

Este proyecto fue desarrollado exclusivamente con fines educativos y de aprendizaje personal. No tiene propósitos comerciales ni se obtiene rédito económico de él. El código se comparte públicamente como parte de mi portfolio profesional.
