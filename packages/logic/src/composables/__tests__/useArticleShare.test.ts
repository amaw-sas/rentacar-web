import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { useArticleShare } from '../useArticleShare'

// SCEN-003 a SCEN-007 de docs/specs/blog-share-mobile.
//
// El compartir del blog salió de la píldora flotante (que el FAB de contacto
// tapaba en móvil) y vive ahora al final del artículo. La lógica es la misma
// para las tres marcas, así que se prueba una vez aquí y no tres veces en el
// markup de cada paquete.

const POST = {
  title: 'Parque Tayrona: qué necesitas para entrar',
  url: 'https://alquilame.co/blog/parque-tayrona',
}

const target = () => POST

function stubShare(impl: (data: unknown) => Promise<void>) {
  vi.stubGlobal('navigator', { share: impl })
}

describe('useArticleShare', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { open: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('SCEN-003: un toque abre la hoja nativa del teléfono', () => {
    it('entrega el título y el enlace del artículo a la hoja del sistema', async () => {
      const share = vi.fn().mockResolvedValue(undefined)
      stubShare(share)

      await useArticleShare(target).shareNative()

      expect(share).toHaveBeenCalledWith({
        title: POST.title,
        text: POST.title,
        url: POST.url,
      })
    })

    it('sólo se ofrece cuando el navegador trae navigator.share', () => {
      vi.stubGlobal('navigator', {})
      const sinHoja = useArticleShare(target)
      sinHoja.detectNativeShare()
      expect(sinHoja.canNativeShare.value).toBe(false)

      stubShare(vi.fn())
      const conHoja = useArticleShare(target)
      conHoja.detectNativeShare()
      expect(conHoja.canNativeShare.value).toBe(true)
    })

    it('arranca en false para que el HTML de ISR y la hidratación coincidan', () => {
      stubShare(vi.fn())
      // Sin detectNativeShare() — es lo que ve el servidor y el primer render
      // del cliente. Decidir antes de montar cambiaría el DOM bajo Vue.
      expect(useArticleShare(target).canNativeShare.value).toBe(false)
    })
  })

  describe('SCEN-004: cancelar la hoja nativa no ensucia nada', () => {
    it('se traga el AbortError del usuario que cierra la hoja', async () => {
      const abort = Object.assign(new Error('Share canceled'), { name: 'AbortError' })
      stubShare(vi.fn().mockRejectedValue(abort))
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(useArticleShare(target).shareNative()).resolves.toBeUndefined()

      expect(error).not.toHaveBeenCalled()
    })

    it('pero un fallo real sí queda registrado', async () => {
      stubShare(vi.fn().mockRejectedValue(new Error('NotAllowedError')))
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})

      await useArticleShare(target).shareNative()

      expect(error).toHaveBeenCalled()
    })
  })

  describe('SCEN-005: sin hoja nativa, siguen los botones de siempre', () => {
    it('WhatsApp lleva el título y el enlace en el texto', () => {
      const share = useArticleShare(target)
      share.shareWhatsApp()

      const [url] = vi.mocked(window.open).mock.calls[0]!
      expect(url).toContain('https://wa.me/?text=')
      expect(decodeURIComponent(String(url))).toContain(POST.title)
      expect(decodeURIComponent(String(url))).toContain(POST.url)
    })

    it('Facebook recibe el enlace del artículo', () => {
      useArticleShare(target).shareFacebook()

      const [url] = vi.mocked(window.open).mock.calls[0]!
      expect(url).toContain('https://www.facebook.com/sharer/sharer.php?u=')
      expect(decodeURIComponent(String(url))).toContain(POST.url)
    })

    it('X recibe el enlace y el título', () => {
      useArticleShare(target).shareTwitter()

      const [url] = vi.mocked(window.open).mock.calls[0]!
      expect(url).toContain('https://twitter.com/intent/tweet?url=')
      expect(decodeURIComponent(String(url))).toContain(POST.url)
      expect(decodeURIComponent(String(url))).toContain(POST.title)
    })
  })

  describe('SCEN-006: el enlace compartido es el canónico', () => {
    it('no toma la barra de direcciones, así que los utm no viajan', () => {
      vi.stubGlobal('window', {
        open: vi.fn(),
        location: { href: `${POST.url}?utm_source=google&gclid=abc` },
      })

      useArticleShare(target).shareFacebook()

      const [url] = vi.mocked(window.open).mock.calls[0]!
      expect(decodeURIComponent(String(url))).not.toContain('utm_source')
      expect(decodeURIComponent(String(url))).not.toContain('gclid')
    })
  })

  describe('SCEN-007: copiar el enlace confirma que copió', () => {
    it('deja la URL del artículo en el portapapeles y confirma dos segundos', async () => {
      vi.useFakeTimers()
      const writeText = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { clipboard: { writeText } })

      const share = useArticleShare(target)
      await share.copyLink()

      expect(writeText).toHaveBeenCalledWith(POST.url)
      expect(share.linkCopied.value).toBe(true)

      vi.advanceTimersByTime(2000)
      expect(share.linkCopied.value).toBe(false)
    })

    it('un portapapeles bloqueado no deja el botón confirmando en falso', async () => {
      vi.stubGlobal('navigator', {
        clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      })
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const share = useArticleShare(target)
      await share.copyLink()

      expect(share.linkCopied.value).toBe(false)
    })
  })
})
