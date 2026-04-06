// External dependencies
import { computed } from 'vue';

// Types
import type { PhoneInputOptionsType } from '@rentacar-main/logic/utils';

export default function usePhoneField() {
    const phoneInputOptions = computed<PhoneInputOptionsType>(() => ({
      showDialCode: false,
      id: "telefono",
      name: "telefono",
      placeholder: "Whatsapp o Teléfono Móvil*",
      'aria-label': "Número de teléfono",
    }));

    const phoneDropdownOptions = {
      disabledDialCode: false,
      showFlags: true,
      showSearchBox: true,
      showDialCodeInList: true,
    };

    const phonePreferredCountries = ["co", "es", "us", "cl", "mx", "ca", "ar"];

    return {
        phoneInputOptions,
        phoneDropdownOptions,
        phonePreferredCountries
    }
}