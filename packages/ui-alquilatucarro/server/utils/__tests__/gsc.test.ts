import { describe, it, expect, vi, beforeEach } from 'vitest'

const maybeSingleMock = vi.fn()
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
const selectMock = vi.fn(() => ({ eq: eqMock }))
const upsertMock = vi.fn()
const fromMock = vi.fn(() => ({ select: selectMock, upsert: upsertMock }))

vi.mock('../../../../logic/server/utils/supabase', () => ({
  useSupabaseAdminClient: () => ({ from: fromMock }),
}))

// Guard: fail if fs is touched. Spy on readFileSync/writeFileSync to detect.
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs')
  return {
    ...actual,
    readFileSync: vi.fn(() => {
      throw new Error('gsc.ts must not read the filesystem')
    }),
    writeFileSync: vi.fn(() => {
      throw new Error('gsc.ts must not write the filesystem')
    }),
    existsSync: vi.fn(() => {
      throw new Error('gsc.ts must not stat the filesystem')
    }),
    mkdirSync: vi.fn(() => {
      throw new Error('gsc.ts must not create directories')
    }),
  }
})

import { getGscTokens, saveGscTokens } from '../gsc'

describe('gsc (Supabase-backed)', () => {
  beforeEach(() => {
    maybeSingleMock.mockReset()
    upsertMock.mockReset()
    eqMock.mockClear()
    selectMock.mockClear()
    fromMock.mockClear()
  })

  describe('getGscTokens', () => {
    it('returns tokens mapped from the singleton row', async () => {
      maybeSingleMock.mockResolvedValueOnce({
        data: {
          id: 'singleton',
          access_token: 'at-123',
          refresh_token: 'rt-456',
          expires_at: 1800000000000,
          token_type: 'Bearer',
          scope: 'https://www.googleapis.com/auth/webmasters.readonly',
          created_at: '2026-04-13T00:00:00.000Z',
          updated_at: '2026-04-13T00:00:00.000Z',
        },
        error: null,
      })

      const tokens = await getGscTokens()

      expect(fromMock).toHaveBeenCalledWith('gsc_tokens')
      expect(selectMock).toHaveBeenCalledWith('*')
      expect(eqMock).toHaveBeenCalledWith('id', 'singleton')
      expect(tokens).toEqual({
        access_token: 'at-123',
        refresh_token: 'rt-456',
        expires_at: 1800000000000,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/webmasters.readonly',
        created_at: '2026-04-13T00:00:00.000Z',
      })
    })

    it('coerces bigint-as-string expires_at into a number', async () => {
      maybeSingleMock.mockResolvedValueOnce({
        data: {
          id: 'singleton',
          access_token: 'at-123',
          refresh_token: null,
          expires_at: '1800000000000',
          token_type: 'Bearer',
          scope: 'scope',
          created_at: '2026-04-13T00:00:00.000Z',
        },
        error: null,
      })

      const tokens = await getGscTokens()

      expect(tokens?.expires_at).toBe(1800000000000)
      expect(typeof tokens?.expires_at).toBe('number')
      expect(tokens?.refresh_token).toBeUndefined()
    })

    it('returns null when no row exists', async () => {
      maybeSingleMock.mockResolvedValueOnce({ data: null, error: null })

      const tokens = await getGscTokens()

      expect(tokens).toBeNull()
    })

    it('returns null on Supabase error instead of throwing', async () => {
      maybeSingleMock.mockResolvedValueOnce({
        data: null,
        error: { message: 'rls denied' },
      })

      const tokens = await getGscTokens()

      expect(tokens).toBeNull()
    })
  })

  describe('saveGscTokens', () => {
    it('upserts the singleton row with the correct payload', async () => {
      upsertMock.mockResolvedValueOnce({ data: null, error: null })

      await saveGscTokens({
        access_token: 'at-new',
        refresh_token: 'rt-new',
        expires_at: 1800000000000,
        token_type: 'Bearer',
        scope: 'scope-x',
        created_at: '2026-04-13T00:00:00.000Z',
      })

      expect(fromMock).toHaveBeenCalledWith('gsc_tokens')
      expect(upsertMock).toHaveBeenCalledWith(
        {
          id: 'singleton',
          access_token: 'at-new',
          refresh_token: 'rt-new',
          expires_at: 1800000000000,
          token_type: 'Bearer',
          scope: 'scope-x',
        },
        { onConflict: 'id' }
      )

      // Ensure created_at / updated_at are NOT sent (DB manages them)
      const payload = upsertMock.mock.calls[0][0]
      expect(payload).not.toHaveProperty('created_at')
      expect(payload).not.toHaveProperty('updated_at')
    })

    it('writes refresh_token as null when absent', async () => {
      upsertMock.mockResolvedValueOnce({ data: null, error: null })

      await saveGscTokens({
        access_token: 'at-new',
        expires_at: 1800000000000,
        token_type: 'Bearer',
        scope: 'scope-x',
        created_at: '2026-04-13T00:00:00.000Z',
      })

      const payload = upsertMock.mock.calls[0][0]
      expect(payload.refresh_token).toBeNull()
    })

    it('throws with a descriptive message when Supabase returns an error', async () => {
      upsertMock.mockResolvedValueOnce({
        data: null,
        error: { message: 'duplicate key' },
      })

      await expect(
        saveGscTokens({
          access_token: 'at',
          expires_at: 1,
          token_type: 'Bearer',
          scope: 's',
          created_at: 'now',
        })
      ).rejects.toThrow(/Failed to save GSC tokens.*duplicate key/)
    })
  })
})
