export interface FiltrosBusquedaProfesorPrimaria {
  Identificador?: string;
  Nombres?: string;
  Apellidos?: string;
  SinAula: boolean;
  Grado?: number | null;
  Seccion?: string | null;
}

export interface WhereProfesoresPrimariaResult {
  whereClause: string;
  valores: any[];
  siguienteContador: number;
}

/**
 * Construye la cláusula WHERE y el array de valores parametrizados
 * para las consultas de profesores de primaria, reutilizable tanto
 * para el SELECT paginado como para el COUNT.
 *
 * @param filtros Filtros de búsqueda
 * @param contadorInicial Número desde el cual empezar a numerar los $N (por defecto 1)
 */
export function construirWhereProfesoresPrimaria(
  filtros: FiltrosBusquedaProfesorPrimaria,
  contadorInicial: number = 1,
): WhereProfesoresPrimariaResult {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let contador = contadorInicial;

  if (filtros.Identificador) {
    condiciones.push(`pp."Id_Profesor_Primaria" ILIKE $${contador}`);
    valores.push(`%${filtros.Identificador}%`);
    contador++;
  }

  if (filtros.Nombres) {
    condiciones.push(`pp."Nombres" ILIKE $${contador}`);
    valores.push(`%${filtros.Nombres}%`);
    contador++;
  }

  if (filtros.Apellidos) {
    condiciones.push(`pp."Apellidos" ILIKE $${contador}`);
    valores.push(`%${filtros.Apellidos}%`);
    contador++;
  }

  const condicionesAula: string[] = [`a."Id_Aula" IS NOT NULL`];

  if (filtros.Grado !== undefined && filtros.Grado !== null) {
    condicionesAula.push(`a."Grado" = $${contador}`);
    valores.push(filtros.Grado);
    contador++;
  }

  if (filtros.Seccion !== undefined && filtros.Seccion !== null) {
    condicionesAula.push(`a."Seccion" = $${contador}`);
    valores.push(filtros.Seccion);
    contador++;
  }

  const bloqueConAula = `(${condicionesAula.join(" AND ")})`;

  const condicionAulaFinal = filtros.SinAula
    ? `(a."Id_Aula" IS NULL OR ${bloqueConAula})`
    : bloqueConAula;

  condiciones.push(condicionAulaFinal);

  const whereClause =
    condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  return { whereClause, valores, siguienteContador: contador };
}
