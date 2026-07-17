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
  // Collapse spaces so legacy "Sin disponibilidad" matches sin_disponibilidad
  // (issue 322 PR2 — otherwise E03 locks the form forever for real no-stock).
  const normalized = String(status ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
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
