import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

/**
 * Nuxt loads oxc-parser while preparing/building an app. Some local macOS ARM
 * installs are missing its optional native package, so they cannot boot Nitro.
 * CI must never skip: a broken CI install is an enforcement failure.
 */
export async function canBootNitro(): Promise<boolean> {
  try {
    const requireFromNuxt = createRequire(import.meta.resolve('nuxt'))
    const parserEntry = requireFromNuxt.resolve('oxc-parser')

    await import(pathToFileURL(parserEntry).href)
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const missingNativeBinding =
      message.includes('@oxc-parser/binding-') || message.includes('Cannot find native binding')

    if (missingNativeBinding && !process.env.CI) return false
    throw error
  }
}
