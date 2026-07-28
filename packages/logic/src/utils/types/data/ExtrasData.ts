export default interface ExtrasData {
  extraDriverDayPrice: number | null
  babySeatDayPrice: number | null
  // Precio FIJO por mes en reserva mensual — no se multiplica por días.
  extraDriverMonthPrice: number | null
  babySeatMonthPrice: number | null
  washPrice: number | null
  washOnsitePrice: number | null
  washDeepPrice: number | null
  washDeepUpholsteryPrice: number | null
}
