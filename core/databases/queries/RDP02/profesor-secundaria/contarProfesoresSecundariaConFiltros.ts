import { query } from "../../../connectors/postgres";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import {
  construirWhereProfesoresSecundaria,
  FiltrosBusquedaProfesorSecundaria,
} from "./construirWhereProfesoresSecundaria";

interface FilaConteo {
  total: string; // COUNT(*) en Postgres devuelve tipo bigint -> string en node-postgres
}

export async function contarProfesoresSecundariaConFiltros(
  filtros: FiltrosBusquedaProfesorSecundaria,
  instanciaEnUso?: RDP02,
): Promise<number> {
  const { whereClause, valores } = construirWhereProfesoresSecundaria(filtros);

  const sql = `
    SELECT COUNT(*) AS total
    FROM "T_Profesores_Secundaria" ps
    LEFT JOIN "T_Aulas" a ON a."Id_Profesor_Secundaria" = ps."Id_Profesor_Secundaria"
    ${whereClause}
  `;

  const result = await query<FilaConteo>(instanciaEnUso, sql, valores);

  return parseInt(result.rows[0]?.total ?? "0", 10);
}
