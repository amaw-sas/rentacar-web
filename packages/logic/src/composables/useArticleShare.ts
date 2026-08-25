// External
import { getCurrentInstance, onMounted, ref, type Ref } from 'vue'

export interface ArticleShareTarget {
  title: string
  url: string
}

export interface ArticleShare {
  /** True sólo después de montar, y sólo si el navegador trae la hoja nativa. */
  canNativeShare: Ref<boolean>
  /** Confirmación efímera del botón de copiar (dos segundos). */
  linkCopied: Ref<boolean>
  /** Detección manual; el composable ya la llama en onMounted. */
  detectNativeShare: () => void
  shareNative: () => Promise<void>
  shareWhatsApp: () => void
  shareFacebook: () => void
  shareTwitter: () => void
  copyLink: () => Promise<void>
}

/**
 * Compartir un artículo del blog, compartido por las tres marcas.
 *
 * Existe por dos razones. La primera es que las cuatro funciones vivían
 * copiadas en los tres `pages/blog/[...slug].vue`. La segunda es la hoja nativa:
 * en móvil, cuatro botones que abren sharers de escritorio en `window.open` son
 * cuatro toques torpes cuando el sistema ya sabe compartir en uno.
 *
 * `canNativeShare` arranca en false a propósito y sólo cambia al montar. El
 * artículo se sirve por ISR: el mismo HTML le llega a todo el mundo, con la fila
 * de respaldo horneada dentro. Decidir en el primer render del cliente —donde
 * `navigator.share` ya existe— cambiaría el DOM justo antes de hidratar.
 *
 * La URL la pone quien llama, y tiene que ser la canónica del post. No se lee
 * `window.location.href`: el lector que llega desde un anuncio la trae con
 * `utm_*` y `gclid` colgando, y eso viajaba dentro de cada enlace compartido.
 */
export function useArticleShare(target: () => ArticleShareTarget): ArticleShare {
  const canNativeShare = ref(false)
  const linkCopied = ref(false)

  function detectNativeShare(): void {
    canNativeShare.value =
      typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  }

  // El guard permite probar el composable fuera de un componente.
  if (getCurrentInstance()) onMounted(detectNativeShare)

  async function shareNative(): Promise<void> {
    const { title, url } = target()
    try {
      // `text` además de `title` porque WhatsApp y Telegram ignoran el título:
      // sin él, el destinatario recibe una URL pelada sin decir de qué es.
      await navigator.share({ title, text: title, url })
    } catch (err) {
      // Cerrar la hoja sin compartir rechaza con AbortError. Es una decisión del
      // lector, no un fallo: registrarla llenaría la consola de ruido.
      if ((err as Error)?.name === 'AbortError') return
      console.error('Failed to share article:', err)
    }
  }

  function openSharer(url: string): void {
    window.open(url, '_blank', 'width=600,height=400')
  }

  function shareWhatsApp(): void {
    const { title, url } = target()
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`, '_blank')
  }

  function shareFacebook(): void {
    openSharer(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(target().url)}`,
    )
  }

  function shareTwitter(): void {
    const { title, url } = target()
    openSharer(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    )
  }

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(target().url)
      linkCopied.value = true
      setTimeout(() => {
        linkCopied.value = false
      }, 2000)
    } catch (err) {
      // Sin permiso de portapapeles no hay nada que confirmar: dejar el botón en
      // "copiado" mentiría sobre algo que el lector va a ir a pegar.
      console.error('Failed to copy link:', err)
    }
  }

  return {
    canNativeShare,
    linkCopied,
    detectNativeShare,
    shareNative,
    shareWhatsApp,
    shareFacebook,
    shareTwitter,
    copyLink,
  }
}
