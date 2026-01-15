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

---
*Bitácora iniciada automáticamente por Antigravity Agent.*
