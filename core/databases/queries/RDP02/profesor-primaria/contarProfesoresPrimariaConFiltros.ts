import { query } from "../../../connectors/postgres";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import {
  construirWhereProfesoresPrimaria,
  FiltrosBusquedaProfesorPrimaria,
} from "./construirWhereProfesoresPrimaria";

interface FilaConteo {
  total: string; // COUNT(*) llega como string desde node-postgres
}

/**
 * Cuenta el total de profesores de primaria que cumplen los filtros dados
 * (usado para calcular la paginación).
 */
export async function contarProfesoresPrimariaConFiltros(
  filtros: FiltrosBusquedaProfesorPrimaria,
  instanciaEnUso?: RDP02,
): Promise<number> {
  const { whereClause, valores } = construirWhereProfesoresPrimaria(filtros);

  const sql = `
    SELECT COUNT(*)::text AS total
    FROM "T_Profesores_Primaria" pp
    LEFT JOIN "T_Aulas" a ON a."Id_Profesor_Primaria" = pp."Id_Profesor_Primaria"
    ${whereClause}
  `;

  const result = await query<FilaConteo>(instanciaEnUso, sql, valores);

  return parseInt(result.rows[0]?.total ?? "0", 10);
}
