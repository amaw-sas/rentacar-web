import { type ReservationApiStatus } from './ReservationApiStatus';

export default interface RecordReservationApiData extends Response {
  reserveCode: string;
  reservationStatus: ReservationApiStatus;
}
