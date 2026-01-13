# Qué Morfamos Dashboard 🍕📊

Dashboard moderno para visualizar estadísticas de restaurantes y ejecutar consultas SQL sobre la base de datos de Supabase.

## ✨ Features

- 📊 **Dashboard** - KPIs y gráficos de distribución (zonas, categorías, timeline)
- 📈 **Estadísticas** - Análisis detallado por barrio, ratings, reviews
- 🔍 **Monitor de Scraping** - Timeline de actividad, top movers, tendencias
- 💾 **SQL Editor** - Editor con Monaco (VS Code) y queries predefinidas
- 📋 **Logs** - Historial de operaciones con filtros
- 🌙 **Dark/Light mode** - Toggle de tema
- 📱 **Responsive** - Sidebar colapsable

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir http://localhost:3000
```

## 🔧 Environment Variables

Crear `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

## 📦 Stack

- **Next.js 16** - App Router + Turbopack
- **shadcn/ui** - Componentes UI
- **Tailwind CSS 4** - Estilos
- **Recharts** - Gráficos
- **Monaco Editor** - SQL Editor
- **Supabase** - PostgreSQL

## 🌐 Deploy en Vercel

1. Push a GitHub
2. Import en [vercel.com](https://vercel.com)
3. Agregar variables de entorno
4. Deploy!

## 📁 Structure

```
src/
├── app/                 # Pages (App Router)
├── components/
│   ├── ui/              # shadcn components
│   ├── dashboard/       # Stats & charts
│   └── ...
└── lib/
    └── supabase.ts      # DB client
```

## 📝 License

MIT
