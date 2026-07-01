// External dependencies
import { computed } from 'vue';
import type { Ref } from 'vue';
import { watchDebounced } from '@vueuse/core';

// Types
import type { PhoneInputOptionsType } from '@rentacar-main/logic/utils';

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
    const phoneInputOptions = computed<PhoneInputOptionsType>(() => ({
      showDialCode: false,
      id: "telefono",
      name: "telefono",
      placeholder: "Whatsapp o Teléfono Móvil*",
      autocomplete: "tel",
    }));

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
        validatePhoneField,
    }
}
