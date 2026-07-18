import { query } from "../../../connectors/postgres";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { ProfesorPrimariaListItem } from "../../../../../src/interfaces/shared/apis/api01/profesores-primaria/types";
import {
  construirWhereProfesoresPrimaria,
  FiltrosBusquedaProfesorPrimaria,
} from "./construirWhereProfesoresPrimaria";

// Shape crudo tal cual viene de la fila SQL (no es el tipo expuesto por la función)
interface FilaProfesorPrimariaConAula {
  Id_Profesor_Primaria: string;
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

export async function buscarProfesoresPrimariaConFiltros(
  filtros: FiltrosBusquedaProfesorPrimaria,
  instanciaEnUso: RDP02 | undefined,
  numeroPagina: number,
  cantidadResultadosPorPagina: number,
): Promise<ProfesorPrimariaListItem[]> {
  const { whereClause, valores, siguienteContador } =
    construirWhereProfesoresPrimaria(filtros);

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
      pp."Id_Profesor_Primaria",
      pp."Nombres",
      pp."Apellidos",
      pp."Estado",
      pp."Celular",
      pp."Google_Drive_Foto_ID",
      a."Id_Aula",
      a."Nivel",
      a."Grado",
      a."Seccion",
      a."Color"
    FROM "T_Profesores_Primaria" pp
    LEFT JOIN "T_Aulas" a ON a."Id_Profesor_Primaria" = pp."Id_Profesor_Primaria"
    ${whereClause}
    ORDER BY pp."Apellidos", pp."Nombres"
    LIMIT $${paramLimit} OFFSET $${paramOffset}
  `;

  const result = await query<FilaProfesorPrimariaConAula>(
    instanciaEnUso,
    sql,
    valoresConPaginacion,
  );

  const profesores: ProfesorPrimariaListItem[] = result.rows.map((fila) => ({
    Id_Profesor_Primaria: fila.Id_Profesor_Primaria,
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
