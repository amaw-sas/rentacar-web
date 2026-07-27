interface NuxtUiFormErrorLike {
  id?: string;
  name?: string;
}

/**
 * Issue #366 (D6) — resuelve el PRIMER campo inválido en ORDEN DE DOM a partir de los
 * errores que emite @nuxt/ui en su evento `error`. Extraído de ReservationForm.vue para
 * poder fijar en un test la forma exacta del evento (`errors[].name` / `errors[].id`) y el
 * caso especial de `telefono`: si @nuxt/ui cambiara esas claves, o alguien rompiera el mapeo
 * o el orden-de-DOM, un test rápido lo caza sin depender del e2e gateado por Supabase.
 *
 * Devuelve el elemento a enfocar, o `null` si ningún error resuelve a un elemento del DOM
 * (el handler entonces no hace nada). El foco/scroll —y su espera de un frame por
 * `loadingAuto`— siguen viviendo en el componente; aquí solo va la resolución pura.
 */
export function firstInvalidFieldEl(
  errors: NuxtUiFormErrorLike[] | null | undefined,
  doc: Document,
): HTMLElement | null {
  const fields = (errors ?? [])
    // VueTelInput no usa useFormField, así que el id que UFormField registra para `telefono`
    // no existe en el DOM; usePhoneField fija `id: "telefono"` de forma determinista. Sin
    // este caso el scroll falla en silencio en el campo más frágil.
    .map((err) => (err?.name === 'telefono' ? 'telefono' : err?.id))
    .map((id) => (id ? doc.getElementById(id) : null))
    .filter((el): el is HTMLElement => el !== null);

  if (!fields.length) return null;

  return fields.reduce((earliest, el) =>
    earliest.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING ? el : earliest,
  );
}
