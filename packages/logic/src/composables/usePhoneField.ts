// External dependencies
import { computed, watch } from 'vue';
import type { Ref } from 'vue';
import { watchDebounced } from '@vueuse/core';

// Types
import type { PhoneInputOptionsType } from '@rentacar-main/logic/utils';

// Id of the visible telefono error message. The brand forms render it through
// UFormField's #error slot (<span id="telefono-error">), and the input points at
// it via aria-describedby while the error is present (issue #322 SCEN-322-X01).
export const PHONE_ERROR_ID = 'telefono-error';

// Minimal surface of the @nuxt/ui UForm ref this composable depends on to bridge
// the phone field's revalidation. Kept local (not imported) so the composable
// stays framework-light and unit-testable at the source level.
interface PhoneFormRef {
  validate: (opts: { name: string }) => Promise<unknown>;
  getErrors: (name: string) => unknown[];
}

export default function usePhoneField(
  form?: Ref<PhoneFormRef | null>,
  getTelefono?: () => string | null | undefined,
) {
    // Reactive: UForm keeps errors in a reactive ref that getErrors() filters,
    // so this recomputes whenever the telefono error appears or clears.
    const phoneFieldInvalid = computed<boolean>(
      () => (form?.value?.getErrors("telefono")?.length ?? 0) > 0,
    );

    const phoneInputOptions = computed<PhoneInputOptionsType>(() => ({
      showDialCode: false,
      id: "telefono",
      name: "telefono",
      placeholder: "Whatsapp o Teléfono Móvil*",
      autocomplete: "tel",
      // vue-tel-input forwards 'aria-describedby' from inputOptions to its
      // native <input>, so the error association rides the normal props path.
      // Only present while the error is visible (SCEN-322-X01).
      "aria-describedby": phoneFieldInvalid.value ? PHONE_ERROR_ID : undefined,
    }));

    // vue-tel-input does NOT bind aria-invalid from inputOptions (its input
    // binds a fixed attribute list: id, name, aria-describedby, ...), so the
    // invalid state is reflected onto the #telefono input directly. Client-only:
    // validation errors only ever exist after client interaction, and the guard
    // keeps SSR inert.
    watch(phoneFieldInvalid, (invalid) => {
      if (typeof document === "undefined") return;
      const el = document.getElementById("telefono");
      if (!el) return;
      if (invalid) el.setAttribute("aria-invalid", "true");
      else el.removeAttribute("aria-invalid");
    });

    const phoneDropdownOptions = {
      disabledDialCode: false,
      showFlags: true,
      showSearchBox: true,
      showDialCodeInList: true,
    };

    const phonePreferredCountries = ["co", "es", "us", "cl", "mx", "ca", "ar"];

    // VueTelInput no se cablea a UFormField, así que UForm nunca revalida
    // `telefono` con sus propios eventos → el error queda obsoleto tras corregir
    // el valor a uno válido (issue #276). Lo revalidamos en blur (como un input
    // nativo) y, con debounce mientras se edita SI ya hay error visible, para que
    // el error obsoleto desaparezca en cuanto el valor pasa a ser válido —sin
    // introducir nagging prematuro al teclear un número nuevo.
    const validatePhoneField = () => {
      form?.value?.validate({ name: "telefono" }).catch(() => {});
    };

    if (form && getTelefono) {
      watchDebounced(
        getTelefono,
        () => {
          if ((form.value?.getErrors("telefono")?.length ?? 0) > 0) {
            validatePhoneField();
          }
        },
        { debounce: 300 },
      );
    }

    return {
        phoneInputOptions,
        phoneDropdownOptions,
        phonePreferredCountries,
        phoneFieldInvalid,
        validatePhoneField,
    }
}
