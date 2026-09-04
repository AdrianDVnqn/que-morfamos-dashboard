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

## 📅 Sesión: 4 de Septiembre de 2026

Auditoría del dashboard antes de publicarlo. Se revisó qué queda expuesto cuando la página deja
de ser local, y se corrigió lo que encontró la revisión.

### 🔐 Seguridad: `execute_sql` permitía leer toda la base

El hallazgo bloqueante. El Explorador SQL llama a una función de Postgres con la `anon key`, que
es **pública** (va embebida en el bundle). Esa función tenía dos defectos que juntos la volvían
una fuga de datos:

1. `SECURITY DEFINER` → corría como `postgres`, así que **el RLS no aplicaba por esa vía**.
2. Se defendía con un `LIKE 'SELECT%'` y un regex de palabras prohibidas, que **no impide leer**:
   `SELECT email FROM auth.users` pasaba los dos filtros sin problema.

Cualquier visitante anónimo podía leer `auth.users` o `vault.secrets` desde las devtools.

**El arreglo no es filtrar mejor el SQL** —ese es un juego que se pierde— sino sacar el
`SECURITY DEFINER`: la función pasa a correr como el rol que la invoca (`anon`), y entonces la
seguridad la da el motor. `anon` no tiene GRANT sobre esas tablas, así que el intento falla con
*permission denied* aunque la consulta sea válida. Se sumó `statement_timeout` de 5s, `search_path`
fijo y un techo de 1000 filas.

El script quedó en el backend (`fix_execute_sql_readonly.sql`), al lado del hardening de grants.

**Verificado desde el navegador**, que es donde importa: lee `lugares`/`reviews`, rechaza los
no-SELECT, corta 205k filas a 1000, y `query_logs` devuelve *permission denied*.

### ♻️ La serie semanal estaba duplicada

El gráfico de reseñas por semana existía **dos veces**: en el dashboard y en el monitor. Unas 60
líneas copiadas de paginado, agrupado por lunes en UTC y relleno de semanas vacías. El costo está
en el propio historial: el bug de timezone y el del padding se arreglaron dos veces, uno por copia.

Ahora vive en `src/lib/scrapingStats.ts`. La fecha de corte —que estaba hardcodeada en los dos
lados sin explicación— quedó documentada con el dato que la justifica: **el 10-ene-2026 se cargó
la base entera de una vez, 80.528 reseñas en un día contra ~1.500 de una semana normal**, y
graficar ese pico aplasta la escala del resto.

### 🎨 Lo que faltaba para que se vea profesional

- **Errores visibles.** Las vistas se tragaban los fetch fallidos con un `console.error` y dejaban
  el panel en blanco: no se distinguía "no hay datos" de "se rompió". Ahora se muestran.
- **Tipos que mentían.** `Review` declaraba un `id: number` inexistente (la clave es `review_id`,
  un texto). El mismo error estaba en una consulta predefinida del explorador SQL, que por eso
  fallaba siempre. Se verificaron las cuatro interfaces contra `information_schema`.
- **Título por ruta.** Las nueve páginas se llamaban igual; con varias pestañas abiertas eran
  indistinguibles. Se agregó un template y metadata de OpenGraph.
- **Logs de depuración fuera.** Uno corría en cada re-render del mapa, serializando propiedades a
  JSON para tirarlas a consola.
- **`force-dynamic` fuera.** Son client components que traen sus datos con `useEffect`: sólo
  renunciaban al prerender estático sin cambiar lo que se sirve. El build confirma que siguen
  estáticas.
- **README.** Decía "actualmente en desarrollo local" y publicitaba el editor SQL sin aclarar que
  es de sólo lectura. Se sumó una sección sobre el modelo de acceso a los datos.

Balance: **50 líneas menos** de código, con más funcionalidad.

### 🧹 Segunda pasada: de 68 problemas de lint a 0

El repo arrastraba **68 problemas de ESLint (39 de ellos errores)**. En un proyecto de portfolio
—donde el código es parte de lo que se muestra— eso pesa. Quedó en **cero**, y en el camino
aparecieron cinco defectos reales que el ruido tenía tapados:

1. **`key={review.review_id || Math.random()}`** en la lista de reseñas. Cuando una reseña no
   traía id, la key cambiaba en **cada render**: React desmontaba y volvía a montar la tarjeta en
   vez de reutilizarla.
2. **El diálogo de detalle no tenía `DialogTitle`.** Radix lo reportaba como error de
   accesibilidad: los lectores de pantalla no anunciaban de qué lugar era la ficha. El `<h2>` con
   el nombre ya estaba; sólo había que declararlo como el título.
3. **`fetchLugares` no escuchaba `pageSize`**, así que cambiar el tamaño de página no volvía a
   pedir los datos. Apareció recién al declarar las dependencias reales de los efectos.
4. **El `useMemo` de las capas del mapa 3D leía `minValues` sin declararlo.** Hoy no se manifiesta
   —sale del mismo memo que `maxValues` y cambian juntos— pero el propio código ya lo declaraba en
   `updateTriggers`, o sea que la dependencia estaba reconocida en un lado y no en el otro.
5. **El tamaño de celda del mapa 3D mostraba "0m" para todo el rango.** `cellSize` está en grados
   y se convertía con factor 111, pero un grado son ~111 **km**: `0.003 * 111 = 0.33` → `0`. El
   mismo archivo ya usaba el factor correcto para el radio de las columnas.

**El grueso de los `any` estaba en el mapa** (30 de los 39 errores). Ahora hay tipos GeoJSON
reales en `src/lib/mapTypes.ts`. Tiparlo destapó que las columnas nullables (`zona`, `barrio`,
`categoria`) se comparaban contra los filtros sin contemplar el `null`, y que `MapFilters` accedía
a los filtros con `(filters as any)[key]` —justo donde la verificación hacía falta—. De paso:
**`Map3D` creaba su propio cliente de Supabase** en lugar de usar el compartido.

También se eliminó un `@ts-ignore` que no suprimía ningún error: se notó al convertirlo a
`@ts-expect-error`, que es exactamente para lo que sirve esa regla.

Verificado en el navegador, porque tocar hooks es riesgoso: **0 pedidos a Supabase en reposo**
(sin bucles por el `useCallback`), 1 por búsqueda, la paginación de logs sigue refrescando, el
mapa dibuja sus 929 marcadores y 50 barrios, y el diálogo resetea su estado al cambiar de lugar
—ahora por remontado con `key` en vez de un efecto, como recomienda React—.

### 📉 Los agregados se mudaron a la base: 1,6 MB → 2 kB por visita

El dashboard calculaba sus números en el **navegador**: bajaba las filas crudas y las sumaba con
JavaScript. Medido sobre la home, contando los bytes del JSON que efectivamente viaja:

| | antes | ahora |
|---|---|---|
| bytes | **1.619.341** | **2.089** |
| consultas | 6 (+7 páginas extra de logs) | 5 |

**Una reducción del 99,9 % — 775 veces menos.** Con el panel publicado, ese costo se pagaba entero
en cada visita.

Lo que dominaba eran dos cosas:
- **980 kB de textos de reseñas** (las 10.000 más recientes) que se bajaban *sólo para contar
  cuántas superan los 30 caracteres*.
- **452 kB de `scraping_logs`**, en ocho peticiones paginadas, para agrupar por semana a mano.

Ahora hay nueve vistas `dashboard_*` en la base (`vistas_dashboard.sql`, en el repo del backend),
todas con `security_invoker` para que queden sujetas al mismo RLS que las tablas base — la misma
decisión que se tomó al contener `execute_sql`.

**No son materializadas, y eso se midió antes de decidir.** Descontando la latencia de red, estos
agregados casi no cuestan cómputo: los `GROUP BY` sobre `lugares` (929 filas) no llegan a 1 ms.
Lo caro nunca fue calcular, era **transferir**. Una vista normal elimina toda esa transferencia y
además no necesita `REFRESH` ni un cron: está siempre fresca. Materializar sería pagar
mantenimiento por milisegundos.

Dos cosas que sólo aparecieron midiendo, y que quedaron escritas en el SQL:

1. **La primera versión de la vista de calidad tardaba 10 segundos.** Juntaba las filas de las dos
   ramas en una CTE y agrupaba al final; el planner reevaluaba en vez de resolver cada mitad por
   su lado. Agregando cada rama por separado: 0,5 s.
2. **No se replicó el `normalizeText()` del front.** Su regexp necesita un backreference
   (`(.){2,}`), que obliga al motor a backtrackear: ~1,5 ms por texto. Medido, **cambia el
   veredicto en 6 de cada 10.000 reseñas (0,06 %) y cuesta 8,6 s contra 0,3 s**. Pagar 30x el
   tiempo para corregir 6 casos —sobre un indicador que ya es una muestra de 10.000 de 205.492—
   no se justifica. El número mostrado difiere ~0,1 % del anterior.

El front perdió 223 líneas. Verificado en el navegador que los KPIs, los gráficos de zona y
categoría, las cuatro distribuciones y la serie semanal dan exactamente lo mismo que antes.

### 📌 Pendiente detectado, no resuelto

El warning `width(-1) and height(-1)` de Recharts **sigue apareciendo** en consola, pese a estar
anotado como resuelto en la sesión del 14-ene. No rompe nada visible, pero conviene mirarlo con
tiempo en vez de darlo por cerrado.
