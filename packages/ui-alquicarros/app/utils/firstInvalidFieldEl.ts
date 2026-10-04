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
    // `tipoLicencia` tiene el defecto gemelo: URadioGroup usa useFormField con bind:false,
    // que anula inputId, y el error llega con `id: undefined` — el radiogroup lleva
    // `id="tipoLicencia"` explícito en el template y aquí se resuelve por name.
    .map((err) =>
      err?.name === 'telefono' || err?.name === 'tipoLicencia' ? err.name : err?.id,
    )
    .map((id) => (id ? doc.getElementById(id) : null))
    .filter((el): el is HTMLElement => el !== null);

  if (!fields.length) return null;

  const earliest = fields.reduce((a, el) =>
    a.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING ? el : a,
  );

  // UFormField puede registrar el id del error en un CONTENEDOR no enfocable
  // (u-radio-group pone el id en su div raíz, sin tabindex): `focus()` sobre él
  // es un no-op mudo. El orden-de-DOM ya se decidió sobre el contenedor; aquí
  // solo se baja al primer control enfocable interno para que el foco prenda.
  const FOCUSABLE = 'input, select, textarea, button, [tabindex]';
  if (earliest.matches(FOCUSABLE)) return earliest;
  return earliest.querySelector<HTMLElement>(FOCUSABLE) ?? earliest;
}
