/**
 * UI component configuration shared across all brands
 * Defines slots and variants for Nuxt UI components
 */
export const uiConfig = {
  slideover: {
    slots: {
      close: 'absolute top-4 end-4 bg-black text-white rounded-full hover:bg-gray-700',
    },
  },
  header: {
    slots: {
      close: 'bg-black text-white rounded-full hover:bg-gray-700',
    },
  },
  pageSection: {
    slots: {
      container:
        "flex flex-col lg:grid py-12 sm:py-6 lg:py-20 gap-8 sm:gap-16",
    },
  },
  pageHero: {
    slots: {
      container:
        "flex flex-col lg:grid py-8 sm:py-16 lg:py-24 gap-8 sm:gap-y-16",
    },
  },
  button: {
    variants: {
      size: {
        "2xl": {
          base: "px-6 py-6 text-xl gap-3",
          leadingIcon: "size-8",
          leadingAvatarSize: "sm",
          trailingIcon: "size-8",
        },
      },
    },
  },
  formField: {
    slots: {
      label: "block font-normal text-default text-sm pl-1",
      container: "mt-0.5 relative",
    },
  },
  checkbox: {
    slots: {
      label: "font-normal text-sm",
    },
  },
} as const;
