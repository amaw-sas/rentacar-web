import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Scenarios captured: a "copy to WhatsApp" button on the city page collapses
// the user's current search criteria into a plain-text message that can be
// pasted into a WhatsApp chat. The composable owns both the formatting and
// the clipboard write.
//
//   S1  Title line uses *bold* syntax — WhatsApp markdown for the heading.
//   S2  When pickup === return, render a single "📍 Lugar:" line; do NOT
//       emit two redundant Recogida/Devolución lines.
//   S3  When pickup !== return, render both "📍 Recogida:" and
//       "📍 Devolución:" lines.
//   S4  Pickup date and pickup hour join with ", " on a single
//       "📅 Recogida:" line; same for return.
//   S5  Day count uses singular "día" for 1, plural "días" otherwise.
//   S6  haveMonthlyReservation flag emits "📆 Reserva mensual".
//   S7  haveTotalInsurance flag emits "🛡 Cobertura total".
//   S8  copyToWhatsapp must early-return when not on client
//       (navigator.clipboard does not exist server-side).
//   S9  copyToWhatsapp calls navigator.clipboard.writeText with the built
//       message, and shows a success toast on resolve.
//   S10 On clipboard rejection, surfaces an error toast (try/catch wrap).
//
// Source-level assertions match the project pattern (see
// useStoreReservationForm.minReturnDate.test.ts) — avoids booting Pinia/Nuxt
// auto-imports for a small string-formatting composable.

const source = readFileSync(
  fileURLToPath(new URL('../useShareSearchParams.ts', import.meta.url)),
  'utf8',
)

function extractFunction(name: string): string {
  const start = source.indexOf(`const ${name} =`)
  expect(start, `missing function ${name}`).toBeGreaterThan(-1)
  const end = source.indexOf('\n  };', start) + '\n  };'.length
  return source.slice(start, end)
}

describe('useShareSearchParams — buildWhatsappMessage formatting', () => {
  const block = extractFunction('buildWhatsappMessage')

  it('S1: title line uses WhatsApp *bold* syntax', () => {
    expect(block).toMatch(/['"`]\*Consulta de alquiler de carro\*['"`]/)
  })

  it('S2: collapses pickup/return into single "Lugar" line when they match', () => {
    expect(block).toMatch(/pickup\s*&&\s*ret\s*&&\s*pickup\s*!==\s*ret/)
    expect(block).toMatch(/📍 Lugar:/)
  })

  it('S3: emits both Recogida and Devolución location lines when they differ', () => {
    expect(block).toMatch(/📍 Recogida:/)
    expect(block).toMatch(/📍 Devolución:/)
  })

  it('S4: pickup date + hour are joined with ", " on a single line', () => {
    expect(block).toMatch(
      /\[\s*humanFormattedPickupDate\.value\s*,\s*humanFormattedPickupHour\.value\s*\][\s\S]*?\.filter\(Boolean\)[\s\S]*?\.join\(\s*['"`],\s*['"`]\s*\)/,
    )
    expect(block).toMatch(
      /\[\s*humanFormattedReturnDate\.value\s*,\s*humanFormattedReturnHour\.value\s*\][\s\S]*?\.filter\(Boolean\)[\s\S]*?\.join\(\s*['"`],\s*['"`]\s*\)/,
    )
  })

  it('S5: day label switches between singular "día" and plural "días"', () => {
    expect(block).toMatch(/selectedDays\.value\s*===\s*1/)
    expect(block).toMatch(/['"`]día['"`]/)
    expect(block).toMatch(/['"`]días['"`]/)
  })

  it('S6: monthly reservation flag emits its own line', () => {
    expect(block).toMatch(/haveMonthlyReservation\.value/)
    expect(block).toMatch(/Reserva mensual/)
  })

  it('S7: total insurance flag emits its own line', () => {
    expect(block).toMatch(/haveTotalInsurance\.value/)
    expect(block).toMatch(/Cobertura total/)
  })
})

describe('useShareSearchParams — copyToWhatsapp clipboard wiring', () => {
  const block = extractFunction('copyToWhatsapp')

  it('S8: early-returns when not on client (no navigator.clipboard on SSR)', () => {
    expect(block).toMatch(/if\s*\(\s*!import\.meta\.client\s*\)\s*return/)
  })

  it('S9: writes the built message via navigator.clipboard.writeText', () => {
    expect(block).toContain('buildWhatsappMessage()')
    expect(block).toContain('navigator.clipboard.writeText(message)')
  })

  it('S9: shows a success toast after a successful copy', () => {
    const tryStart = block.indexOf('try {')
    const catchStart = block.indexOf('} catch')
    expect(tryStart).toBeGreaterThan(-1)
    expect(catchStart).toBeGreaterThan(tryStart)
    const tryBody = block.slice(tryStart, catchStart)
    expect(tryBody).toMatch(/toast\.add\(/)
    expect(tryBody).toMatch(/color:\s*['"`]success['"`]/)
  })

  it('S10: surfaces an error toast when the clipboard write rejects', () => {
    const catchStart = block.indexOf('} catch')
    expect(catchStart).toBeGreaterThan(-1)
    const catchBody = block.slice(catchStart)
    expect(catchBody).toMatch(/toast\.add\(/)
    expect(catchBody).toMatch(/color:\s*['"`]error['"`]/)
  })
})
