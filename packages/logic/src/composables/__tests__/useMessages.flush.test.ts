import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// SCEN-018 on a results page: the search opens with flushMessages(), which used
// to clear EVERY toast and so erased the advisor notice («Código de asesor no
// encontrado») raised a moment earlier. A flush must only drop search messages.

let nextId = 0
const toasts: Array<{ id: string; title: string }> = []
const toast = {
  add: vi.fn((t: { title: string }) => {
    const body = { ...t, id: `t${++nextId}` }
    toasts.push(body)
    return body
  }),
  remove: vi.fn((id: string) => {
    const i = toasts.findIndex((t) => t.id === id)
    if (i !== -1) toasts.splice(i, 1)
  }),
  clear: vi.fn(() => void toasts.splice(0)),
}

beforeEach(() => {
  toasts.splice(0)
  vi.clearAllMocks()
  vi.stubGlobal('useToast', () => toast)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useMessages.flushMessages', () => {
  it('drops the search messages but keeps toasts raised by others', async () => {
    const { default: useMessages } = await import('../useMessages')
    toast.add({ title: 'Código de asesor no encontrado' })
    const { createMessage, flushMessages } = useMessages()
    createMessage({ title: 'Sin disponibilidad', description: 'x', type: 'error' } as never)

    flushMessages()

    expect(toasts.map((t) => t.title)).toEqual(['Código de asesor no encontrado'])
    expect(toast.clear).not.toHaveBeenCalled()
  })

  it('the id set is client-only: on the server tracking is skipped and a flush clears (source)', async () => {
    // A module-level Set on the server would be shared by every request and grow
    // for the life of the process. import.meta.server is undefined under vitest,
    // so the guard is pinned on the source, as useChatConversation's tests do.
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(new URL('../useMessages.ts', import.meta.url), 'utf8')
    expect(src).toMatch(/const track = [\s\S]*?if \(import\.meta\.server\) return;/)
    expect(src).toMatch(/const flushMessages = \(\) => \{\s*if \(import\.meta\.server\) \{\s*toast\.clear\(\);\s*return;/)
  })

  it('a flush from one useMessages instance drops messages created by another', async () => {
    const { default: useMessages } = await import('../useMessages')
    useMessages().createMessage({ title: 'A', description: 'x', type: 'error' } as never)
    useMessages().flushMessages()
    expect(toasts).toEqual([])
  })
})
