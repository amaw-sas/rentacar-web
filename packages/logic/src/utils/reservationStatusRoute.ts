// Maps a reservation status (from admin or legacy Laravel) to the Nuxt route
// the reservation form should redirect to after successful submit.
//
// The admin API returns lowercase statuses (reservado, pendiente,
// sin_disponibilidad, mensualidad). The legacy Laravel backend used
// capitalized labels (Confirmado, Pendiente). We accept both during the
// migration window.
//
// Returns `null` for unknown statuses — the caller stays on the current page
// instead of guessing a destination.

export function routeForReservationStatus(
  status: string | null | undefined,
  reserveCode: string | null | undefined,
): string | null {
  const normalized = String(status ?? "").toLowerCase();
  switch (normalized) {
    case "reservado":
    case "confirmado":
      return `/reservado/${reserveCode ?? ""}`;
    case "pendiente":
    case "mensualidad":
      return "/pendiente";
    case "sin_disponibilidad":
    case "sindisponibilidad":
      return "/sindisponibilidad";
    default:
      return null;
  }
}
