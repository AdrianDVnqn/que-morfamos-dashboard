/**
 * Mapa base de los dos mapas del dashboard.
 *
 * POR QUÉ VECTORIAL Y NO EL RASTER DE SIEMPRE
 * -------------------------------------------
 * CARTO le cortó el tier anónimo a sus tiles RASTER: siguen respondiendo HTTP 200 —así que no
 * falla nada ni se ve un error— pero llegan con "API KEY REQUIRED" estampado sobre la imagen.
 * El mapa 2D venía pidiendo `basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png` y se veía así.
 *
 * El mismo CARTO servido en VECTORIAL no tiene ese problema, y la razón es estructural: en raster
 * el servidor manda una imagen ya dibujada y puede estamparle lo que quiera encima; en vectorial
 * manda geometrías y reglas de estilo, y el dibujo ocurre en el navegador. Para poner una marca
 * de agua tendrían que agregarla como capa dentro del style.json — se revisaron las 93 capas y
 * ninguna la trae.
 *
 * El mapa 3D ya venía usando este estilo, y por eso se veía bien mientras el 2D no. Ahora los dos
 * leen de acá.
 *
 * SI ALGÚN DÍA CARTO TAMBIÉN CIERRA ESTO
 * --------------------------------------
 * Que hoy esté abierto es una decisión de CARTO, no un contrato. Si lo cierran, se cambia esta
 * constante y se arreglan los dos mapas de una: antes cada uno tenía su URL por separado.
 *
 * La alternativa evaluada fue Stadia Alidade Smooth Dark (la que usa el frontend web, con key
 * propia y free tier permanente): funciona, pero es bastante más clara y mucho más cargada de
 * etiquetas, y desentona con el tema oscuro del panel. OpenFreeMap Fiord se descartó por ser
 * azul y no oscuro; Esri Dark Gray, porque en Neuquén no tiene datos por encima de z16.
 */
export const ESTILO_BASE_OSCURO =
    "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"

export const ATRIBUCION_BASE =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
