import { SuccessResponseAPIBase } from "../../types";
import { AuxiliarSinContraseña } from "../../shared/others/types";
import { Genero } from "../../../Genero";

export type AuxiliarDataNecesariaParaCambioEstado = Pick<
  AuxiliarSinContraseña,
  "Id_Auxiliar" | "Nombres" | "Apellidos" | "Estado"
>;

// Interfaces para los endpoints
export interface GetAuxiliaresSuccessResponse extends SuccessResponseAPIBase {
  data: AuxiliarSinContraseña[];
}

export interface GetAuxiliarSuccessResponse extends SuccessResponseAPIBase {
  data: AuxiliarSinContraseña;
}

export interface UpdateAuxiliarRequestBody {
  Nombres?: string;
  Apellidos?: string;
  Genero?: Genero;
  Celular?: string;
  Correo_Electronico?: string | null;
}

export interface UpdateAuxiliarSuccessResponse extends SuccessResponseAPIBase {
  data: {
    Id_Auxiliar: string;
    Nombres: string;
    Apellidos: string;
    Genero: string;
    Estado: boolean;
    Celular: string;
    Correo_Electronico: string | null;
  };
}

export interface SwitchEstadoAuxiliarSuccessResponse
  extends SuccessResponseAPIBase {
  data: AuxiliarDataNecesariaParaCambioEstado;
}
