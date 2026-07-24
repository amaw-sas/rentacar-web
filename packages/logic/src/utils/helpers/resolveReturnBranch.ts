export type ReturnBranchResolution = {
  /** Código de sede que se escribe en el formulario. `null` = sin sede resoluble. */
  code: string | null;
  /** true solo cuando el usuario PIDIÓ una sede y no se le pudo dar. Gobierna el aviso. */
  corrected: boolean;
};

// Issue #402. Decide la sede de devolución de un enlace /reservas, distinguiendo
// dos cosas que el código anterior confundía: que el enlace NO traiga devolución
// (corto y legítimo → se devuelve donde se recogió, en silencio) y que la traiga
// pero no resuelva contra las sedes (enlace roto → mismo fallback, pero hay que
// avisar). Sin sede de recogida a la que caer no hay corrección que anunciar.
// Los predicados son de veracidad a propósito: una cadena vacía no es un slug ni
// un código de sede.
export function resolveReturnBranch(
  slugDevolucion: string | undefined,
  returnCode: string | undefined,
  pickupCode: string | null,
): ReturnBranchResolution {
  if (!slugDevolucion) return { code: pickupCode, corrected: false };
  if (returnCode) return { code: returnCode, corrected: false };
  return { code: pickupCode, corrected: pickupCode !== null };
}
