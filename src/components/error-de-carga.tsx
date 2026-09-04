import { AlertCircle } from "lucide-react"

/**
 * Estado de error para una vista que no pudo traer sus datos.
 *
 * Existe porque antes los fetch fallidos se logueaban a consola y dejaban el gráfico vacío: el
 * visitante veía un panel en blanco sin saber si no había datos o si algo se había roto.
 */
export function ErrorDeCarga({ mensaje }: { mensaje?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No se pudieron cargar los datos</p>
            {mensaje && (
                <p className="max-w-md text-sm text-muted-foreground break-words">{mensaje}</p>
            )}
        </div>
    )
}
