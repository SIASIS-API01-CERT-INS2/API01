import { query } from "../../../connectors/postgres";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { ProfesorPrimariaSinContraseña } from "../../../../../src/interfaces/shared/apis/api01/profesores-primaria/types";
import { Genero } from "../../../../../src/interfaces/shared/Genero";

// Shape crudo tal cual viene de la fila SQL (no es el tipo expuesto por la función)
interface FilaProfesorPrimariaDetalle {
  Id_Profesor_Primaria: string;
  Nombres: string;
  Apellidos: string;
  Genero: string;
  Estado: boolean;
  Celular: string;
  Correo_Electronico: string | null;
  Nombre_Usuario: string;
  Google_Drive_Foto_ID: string | null;
  Id_Aula: number | null;
  Nivel: string | null;
  Grado: number | null;
  Seccion: string | null;
  Color: string | null;
}

/**
 * Obtiene el detalle de un profesor de primaria (con su aula, si tiene) por su id.
 */
export async function obtenerDetallesDeProfesorPrimariaPorId(
  idProfesorPrimaria: string,
  instanciaEnUso?: RDP02,
): Promise<ProfesorPrimariaSinContraseña | null> {
  const sql = `
    SELECT 
      pp."Id_Profesor_Primaria",
      pp."Nombres",
      pp."Apellidos",
      pp."Genero",
      pp."Estado",
      pp."Celular",
      pp."Correo_Electronico",
      pp."Nombre_Usuario",
      pp."Google_Drive_Foto_ID",
      a."Id_Aula",
      a."Nivel",
      a."Grado",
      a."Seccion",
      a."Color"
    FROM "T_Profesores_Primaria" pp
    LEFT JOIN "T_Aulas" a ON a."Id_Profesor_Primaria" = pp."Id_Profesor_Primaria"
    WHERE pp."Id_Profesor_Primaria" = $1
  `;

  const result = await query<FilaProfesorPrimariaDetalle>(instanciaEnUso, sql, [
    idProfesorPrimaria,
  ]);

  if (result.rows.length === 0) return null;

  const fila = result.rows[0];

  const profesor: ProfesorPrimariaSinContraseña = {
    Id_Profesor_Primaria: fila.Id_Profesor_Primaria,
    Nombres: fila.Nombres,
    Apellidos: fila.Apellidos,
    Genero: fila.Genero as Genero,
    Estado: fila.Estado,
    Celular: fila.Celular,
    Correo_Electronico: fila.Correo_Electronico,
    Nombre_Usuario: fila.Nombre_Usuario,
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
  };

  return profesor;
}
