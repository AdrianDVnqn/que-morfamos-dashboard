# 📔 Bitácora de Desarrollo - Dashboard

Registro de cambios en el frontend de administración (Dashboard Next.js/React).

## 📅 Sesión: 14 de Enero de 2026

### 🐛 Bug Fixes
- **Tooltips de Métricas:** Se reemplazaron los componentes `Tooltip` de shadcn/ui por una implementación click-based o más robusta en las tarjetas "Total Reseñas" y "Reseñas 24h", ya que el hover fallaba o cortaba el contenido.
    - Se agregó desglose de calidad de reseñas (con texto vs sin texto).
- **Gráficos Responsive:** Solución al error `width(-1) and height(-1)` en `charts.tsx` y `TopKeywords.tsx` asegurando que el contenedor padre tenga dimensiones definidas antes de renderizar el gráfico Recharts.

---

## 📅 Sesión: 15 de Enero de 2026

### ✨ Nuevas Funcionalidades

#### 🗺️ Mapa de Calor (Heatmap)
- **Toggle para activar/desactivar:** Se agregó un switch "Mapa de Calor" en los filtros del mapa que permite superponer un heatmap sobre la vista de restaurantes.
- **Tres modos de visualización:**
  - 📊 **Por Reseñas:** Intensidad basada en cantidad de reseñas (muestra lugares populares)
  - 📍 **Por Densidad:** Peso igual para todos los lugares (muestra concentración de locales)
  - ⭐ **Por Rating:** Intensidad basada en calificación promedio (muestra zonas de mejor calidad gastronómica)
- Usa `react-leaflet-heatmap-layer-v3` integrado con el mapa existente de Leaflet.
- El modo Rating usa escala exponencial (`rating²`) para mejor diferenciación visual.

### 🛠️ Mejoras Técnicas
- Refactor del componente `MapFilters` para soportar controles de heatmap.
- Nuevo tipo `HeatmapPoint` para cálculo de intensidades.
- UI compacta con grid de 3 columnas para los selectores de modo.

#### 🎬 Toggle 2D/3D en Mapa 3D
- **Botón flotante animado** en la esquina superior izquierda del mapa 3D con diseño glassmorphism.
- **Transición suave de cámara** entre vista cenital (2D, pitch=0°) e isométrica (3D, pitch=55°).
- Usa `FlyToInterpolator` de deck.gl con easing exponencial para animación snappy sin overshoot.
- **Diseño dinámico:** 
  - Gradiente violeta/fucsia para modo 3D
  - Gradiente cyan/azul para modo 2D
  - Iconos SVG animados (cubo 3D ↔ grid 2D)
  - Switch indicator deslizante
- El hint de navegación cambia según el modo activo.

---

## 📅 Sesión: 17 de Enero de 2026

### 📱 Adaptación Mobile

#### 🍔 Menú de Navegación Mobile
- **SidebarTrigger:** Se agregó el botón hamburguesa en el header principal (`layout.tsx`) para permitir abrir el sidebar en dispositivos móviles.
- El sidebar ahora se despliega como un drawer/sheet deslizable en pantallas pequeñas.
- Funciona con el hook `useIsMobile` que detecta viewports < 768px.

#### 📊 Charts Responsivos
- **ReviewsByZonaChart:** Cambiado de `col-span-2` a `col-span-full md:col-span-2` para ocupar todo el ancho en mobile.
- **CategoriesChart:** Agregado `col-span-full md:col-span-1` explícito para consistencia.
- Las StatsCards ya estaban bien configuradas con `md:grid-cols-2 lg:grid-cols-3`.

### 🛠️ Archivos Modificados
- `src/app/layout.tsx` - Import y uso de SidebarTrigger
- `src/components/dashboard/charts.tsx` - Clases responsive para col-span

---
*Bitácora iniciada automáticamente por Antigravity Agent.*
