import { query } from "../../../connectors/postgres";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { ProfesorSecundariaSinContraseña } from "../../../../../src/interfaces/shared/apis/api01/profesores-secundaria/types";
import { Genero } from "../../../../../src/interfaces/shared/Genero";

// Shape crudo tal cual viene de la fila SQL (no es el tipo expuesto por la función)
interface FilaProfesorSecundariaDetalle {
  Id_Profesor_Secundaria: string;
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
 * Obtiene el detalle de un profesor de secundaria (con su aula, si tiene) por su id.
 */
export async function obtenerDetallesDeProfesorSecundariaPorId(
  idProfesorSecundaria: string,
  instanciaEnUso?: RDP02
): Promise<ProfesorSecundariaSinContraseña | null> {
  const sql = `
    SELECT 
      ps."Id_Profesor_Secundaria",
      ps."Nombres",
      ps."Apellidos",
      ps."Genero",
      ps."Estado",
      ps."Celular",
      ps."Correo_Electronico",
      ps."Nombre_Usuario",
      ps."Google_Drive_Foto_ID",
      a."Id_Aula",
      a."Nivel",
      a."Grado",
      a."Seccion",
      a."Color"
    FROM "T_Profesores_Secundaria" ps
    LEFT JOIN "T_Aulas" a ON a."Id_Profesor_Secundaria" = ps."Id_Profesor_Secundaria"
    WHERE ps."Id_Profesor_Secundaria" = $1
  `;

  const result = await query<FilaProfesorSecundariaDetalle>(
    instanciaEnUso,
    sql,
    [idProfesorSecundaria]
  );

  if (result.rows.length === 0) return null;

  const fila = result.rows[0];

  const profesor: ProfesorSecundariaSinContraseña = {
    Id_Profesor_Secundaria: fila.Id_Profesor_Secundaria,
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