// Issue #368 hallazgo 1 — requisitos "qué llevar" en una sola fuente. Los usa el
// formulario de reserva (ReservationForm.vue) y el checklist de la confirmación
// (reservado/[reserveCode]/index.vue). Una constante compartida evita que
// diverjan cuando el issue pide "repetir los requisitos como checklist".
export const RESERVATION_REQUIREMENTS: readonly string[] = [
  'Contar con una tarjeta de crédito',
  'Ser mayor de edad con cédula o pasaporte',
  'Contar con licencia de conducción vigente.',
] as const
