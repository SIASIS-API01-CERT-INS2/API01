import { query } from "../../../connectors/postgres";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { ProfesorSecundariaListItem } from "../../../../../src/interfaces/shared/apis/api01/profesores-secundaria/types";
import {
  construirWhereProfesoresSecundaria,
  FiltrosBusquedaProfesorSecundaria,
} from "./construirWhereProfesoresSecundaria";

// Shape crudo tal cual viene de la fila SQL (no es el tipo expuesto por la función)
interface FilaProfesorSecundariaConAula {
  Id_Profesor_Secundaria: string;
  Nombres: string;
  Apellidos: string;
  Estado: boolean;
  Celular: string;
  Google_Drive_Foto_ID: string | null;
  Id_Aula: number | null;
  Nivel: string | null;
  Grado: number | null;
  Seccion: string | null;
  Color: string | null;
}

export async function buscarProfesoresSecundariaConFiltros(
  filtros: FiltrosBusquedaProfesorSecundaria,
  instanciaEnUso: RDP02 | undefined,
  numeroPagina: number,
  cantidadResultadosPorPagina: number,
): Promise<ProfesorSecundariaListItem[]> {
  const { whereClause, valores, siguienteContador } =
    construirWhereProfesoresSecundaria(filtros);

  // Parámetros de paginación van al final, continuando la numeración de $N
  const offset = (numeroPagina - 1) * cantidadResultadosPorPagina;
  const paramLimit = siguienteContador;
  const paramOffset = siguienteContador + 1;

  const valoresConPaginacion = [
    ...valores,
    cantidadResultadosPorPagina,
    offset,
  ];

  const sql = `
    SELECT 
      ps."Id_Profesor_Secundaria",
      ps."Nombres",
      ps."Apellidos",
      ps."Estado",
      ps."Celular",
      ps."Google_Drive_Foto_ID",
      a."Id_Aula",
      a."Nivel",
      a."Grado",
      a."Seccion",
      a."Color"
    FROM "T_Profesores_Secundaria" ps
    LEFT JOIN "T_Aulas" a ON a."Id_Profesor_Secundaria" = ps."Id_Profesor_Secundaria"
    ${whereClause}
    ORDER BY ps."Apellidos", ps."Nombres"
    LIMIT $${paramLimit} OFFSET $${paramOffset}
  `;

  const result = await query<FilaProfesorSecundariaConAula>(
    instanciaEnUso,
    sql,
    valoresConPaginacion,
  );

  const profesores: ProfesorSecundariaListItem[] = result.rows.map((fila) => ({
    Id_Profesor_Secundaria: fila.Id_Profesor_Secundaria,
    Nombres: fila.Nombres,
    Apellidos: fila.Apellidos,
    Estado: fila.Estado,
    Celular: fila.Celular,
    Google_Drive_Foto_ID: fila.Google_Drive_Foto_ID,
    Aula: fila.Id_Aula
      ? {
          Id_Aula: fila.Id_Aula,
          Nivel: fila.Nivel!,
          Grado: fila.Grado!,
          Seccion: fila.Seccion!,
          Color: fila.Color!,
        }
      : null,
  }));

  return profesores;
}