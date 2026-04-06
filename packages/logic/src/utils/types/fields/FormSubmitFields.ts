import { type CategoryType } from '../type/CategoryType';

export default interface FormFields {
  nombreCompleto: string | null;
  tipoIdentificacion: string | null;
  identificacion: string | null;
  telefono: string | null;
  email: string | null;
  aerolinea?: string | null;
  numeroVueloIda?: string | null;
  vehiculo: CategoryType | null;
  lugarRecogida: string | null;
  fechaRecogida: string | null;
  horaRecogida: string | null;
  lugarDevolucion: string | null;
  fechaDevolucion: string | null;
  horaDevolucion: string | null;
  url?: string | null;
  politicaPrivacidad: boolean | null;
  diasCotizados: number | undefined;
  horasExtras: number | undefined;
  precioDiaCarro: string | undefined;
  precioHorasExtras: string | undefined;
  precioDiaSeguro: string | undefined;
  precioSeguro: string | undefined;
  precioSubtotal: string | undefined;
  precioTasaAdministrativa: string | undefined;
  precioIva: string | undefined;
  precioTotal: string | undefined;
}
