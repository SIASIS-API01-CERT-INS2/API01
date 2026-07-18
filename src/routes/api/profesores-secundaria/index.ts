import { Request, Response, Router } from "express";
import { ErrorResponseAPIBase } from "../../../interfaces/shared/apis/types";
import {
  RequestErrorTypes,
  SystemErrorTypes,
  UserErrorTypes,
  ValidationErrorTypes,
} from "../../../interfaces/shared/errors";
import { validateIdentificadorDeUsuario } from "../../../lib/helpers/validators/data/validateIdentificadorDeUsuario";
import { handleSQLError } from "../../../lib/helpers/handlers/errors/postgreSQL";
import {
  GetProfesorSecundariaSuccessResponse,
  GetProfesoresSecundariaSuccessResponse,
} from "../../../interfaces/shared/apis/api01/profesores-secundaria/types";
import { buscarProfesoresSecundariaConFiltros } from "../../../../core/databases/queries/RDP02/profesor-secundaria/buscarProfesoresSecundariaConFiltros";
import { obtenerDetallesDeProfesorSecundariaPorId } from "../../../../core/databases/queries/RDP02/profesor-secundaria/obtenerDetallesDeProfesorSecundariaPorId";
import { contarProfesoresSecundariaConFiltros } from "../../../../core/databases/queries/RDP02/profesor-secundaria/contarProfesoresSecundariaConFiltros";

const router = Router();

const CANTIDAD_RESULTADOS_POR_PAGINA_DEFAULT = 10;
const CANTIDAD_RESULTADOS_POR_PAGINA_MAXIMA = 100;

// Listar / buscar profesores de secundaria con filtros
router.get("/", (async (req: Request, res: Response) => {
  try {
    const rdp02EnUso = req.RDP02_INSTANCE!;
    const {
      Identificador,
      Nombres,
      Apellidos,
      SinAula,
      Aula,
      Numero_Pagina,
      Cantidad_Resultados_Por_Pagina,
    } = req.query;

    const sinAulaBool =
      typeof SinAula === "string" ? SinAula.toLowerCase() === "true" : false;

    let grado: number | null = null;
    let seccion: string | null = null;

    // ✅ Ya NO depende de sinAulaBool
    if (typeof Aula === "string" && Aula.length > 0) {
      const partes = Aula.split(",");

      if (partes.length !== 2) {
        return res.status(400).json({
          success: false,
          message:
            "El parámetro 'Aula' debe tener el formato 'Grado,Seccion' (ej: T,T | 1,T | 3,B)",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      const [gradoRaw, seccionRaw] = partes;

      if (gradoRaw !== "T") {
        const gradoNum = parseInt(gradoRaw, 10);
        if (isNaN(gradoNum)) {
          return res.status(400).json({
            success: false,
            message: "El grado indicado en el parámetro 'Aula' es inválido",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        }
        grado = gradoNum;
      }

      if (seccionRaw !== "T") {
        seccion = seccionRaw;
      }
    }

    // ------------------------------------------------------------------
    //                 VALIDACIÓN DE PAGINACIÓN
    // ------------------------------------------------------------------

    // Numero_Pagina es obligatorio
    if (typeof Numero_Pagina !== "string" || Numero_Pagina.length === 0) {
      return res.status(400).json({
        success: false,
        message: "El parámetro 'Numero_Pagina' es obligatorio",
        errorType: RequestErrorTypes.INVALID_PARAMETERS,
      } as ErrorResponseAPIBase);
    }

    if (!/^-?\d+$/.test(Numero_Pagina)) {
      return res.status(400).json({
        success: false,
        message: "El parámetro 'Numero_Pagina' debe ser un número entero",
        errorType: RequestErrorTypes.INVALID_PARAMETERS,
      } as ErrorResponseAPIBase);
    }

    const numeroPagina = parseInt(Numero_Pagina, 10);

    if (numeroPagina === 0) {
      return res.status(400).json({
        success: false,
        message: "No existe la página 0. La numeración de páginas inicia en 1",
        errorType: RequestErrorTypes.INVALID_PARAMETERS,
      } as ErrorResponseAPIBase);
    }

    if (numeroPagina < 0) {
      return res.status(400).json({
        success: false,
        message: "El parámetro 'Numero_Pagina' no puede ser negativo",
        errorType: RequestErrorTypes.INVALID_PARAMETERS,
      } as ErrorResponseAPIBase);
    }

    // Cantidad_Resultados_Por_Pagina es opcional, con valor por defecto
    let cantidadResultadosPorPagina = CANTIDAD_RESULTADOS_POR_PAGINA_DEFAULT;

    if (
      typeof Cantidad_Resultados_Por_Pagina === "string" &&
      Cantidad_Resultados_Por_Pagina.length > 0
    ) {
      if (!/^-?\d+$/.test(Cantidad_Resultados_Por_Pagina)) {
        return res.status(400).json({
          success: false,
          message:
            "El parámetro 'Cantidad_Resultados_Por_Pagina' debe ser un número entero",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      const cantidad = parseInt(Cantidad_Resultados_Por_Pagina, 10);

      if (cantidad === 0) {
        return res.status(400).json({
          success: false,
          message:
            "El parámetro 'Cantidad_Resultados_Por_Pagina' no puede ser 0",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      if (cantidad < 0) {
        return res.status(400).json({
          success: false,
          message:
            "El parámetro 'Cantidad_Resultados_Por_Pagina' no puede ser negativo",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      if (cantidad > CANTIDAD_RESULTADOS_POR_PAGINA_MAXIMA) {
        return res.status(400).json({
          success: false,
          message: `El parámetro 'Cantidad_Resultados_Por_Pagina' no puede superar ${CANTIDAD_RESULTADOS_POR_PAGINA_MAXIMA}`,
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      cantidadResultadosPorPagina = cantidad;
    }

    // ------------------------------------------------------------------

    const filtros = {
      Identificador:
        typeof Identificador === "string" && Identificador.length > 0
          ? Identificador
          : undefined,
      Nombres:
        typeof Nombres === "string" && Nombres.length > 0 ? Nombres : undefined,
      Apellidos:
        typeof Apellidos === "string" && Apellidos.length > 0
          ? Apellidos
          : undefined,
      SinAula: sinAulaBool,
      Grado: grado,
      Seccion: seccion,
    };

    // Conteo total y datos paginados en paralelo
    const [totalResultados, profesores] = await Promise.all([
      contarProfesoresSecundariaConFiltros(filtros, rdp02EnUso),
      buscarProfesoresSecundariaConFiltros(
        filtros,
        rdp02EnUso,
        numeroPagina,
        cantidadResultadosPorPagina,
      ),
    ]);

    const totalPaginas = Math.max(
      1,
      Math.ceil(totalResultados / cantidadResultadosPorPagina),
    );

    return res.status(200).json({
      success: true,
      message: "Profesores de secundaria obtenidos exitosamente",
      data: profesores,
      paginacion: {
        Pagina_Actual: numeroPagina,
        Cantidad_Resultados_Por_Pagina: cantidadResultadosPorPagina,
        Total_Resultados: totalResultados,
        Total_Paginas: totalPaginas,
      },
    } as GetProfesoresSecundariaSuccessResponse);
  } catch (error) {
    console.error("Error al obtener profesores de secundaria:", error);

    const handledError = handleSQLError(error);
    if (handledError) {
      return res.status(handledError.status).json(handledError.response);
    }

    return res.status(500).json({
      success: false,
      message: "Error al obtener profesores de secundaria",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as ErrorResponseAPIBase);
  }
}) as any);

// Detalle de un profesor de secundaria
router.get("/:idProfesorSecundaria", (async (req: Request, res: Response) => {
  try {
    const { idProfesorSecundaria } = req.params;
    const rdp02EnUso = req.RDP02_INSTANCE!;

    const idValidation = validateIdentificadorDeUsuario(
      idProfesorSecundaria,
      true,
    );
    if (!idValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: idValidation.errorMessage,
        errorType: ValidationErrorTypes.INVALID_USER_IDENTIFIER,
      } as ErrorResponseAPIBase);
    }

    const profesor = await obtenerDetallesDeProfesorSecundariaPorId(
      idProfesorSecundaria,
      rdp02EnUso,
    );

    if (!profesor) {
      return res.status(404).json({
        success: false,
        message: "Profesor de secundaria no encontrado",
        errorType: UserErrorTypes.USER_NOT_FOUND,
      } as ErrorResponseAPIBase);
    }

    return res.status(200).json({
      success: true,
      message: "Profesor de secundaria obtenido exitosamente",
      data: profesor,
    } as GetProfesorSecundariaSuccessResponse);
  } catch (error) {
    console.error("Error al obtener profesor de secundaria:", error);

    const handledError = handleSQLError(error);
    if (handledError) {
      return res.status(handledError.status).json(handledError.response);
    }

    return res.status(500).json({
      success: false,
      message: "Error al obtener profesor de secundaria",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as ErrorResponseAPIBase);
  }
}) as any);

export default router;
