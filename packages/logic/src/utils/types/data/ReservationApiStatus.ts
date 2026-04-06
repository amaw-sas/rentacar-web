type PositiveReservationStatus = "Pendiente" | "Confirmado";
type NegativeReservationStatus = "Sin disponibilidad";

export type ReservationApiStatus =
  | PositiveReservationStatus
  | NegativeReservationStatus;
