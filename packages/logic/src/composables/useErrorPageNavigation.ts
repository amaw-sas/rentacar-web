export interface GoBackOrHomeDeps {
  /** `window.history.state?.back`: Vue Router lo llena solo si la página previa es de la app. */
  hasInAppBack: boolean
  clearError: (options?: { redirect?: string }) => Promise<void> | void
  back: () => void
}

/**
 * "Volver atrás" de la página de error.
 *
 * Con página previa de la app: solo router.back(). El router de Nuxt limpia
 * el error al navegar (afterEach); llamar clearError() antes re-montaría la
 * ruta fallida y haría parpadear la página. Sin página previa (entrada directa
 * o desde Google, aunque history.length > 1) se va a la home.
 */
export async function goBackOrHome({ hasInAppBack, clearError, back }: GoBackOrHomeDeps) {
  if (hasInAppBack) {
    back()
    return
  }
  await clearError({ redirect: '/' })
}
