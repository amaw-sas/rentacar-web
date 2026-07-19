import { expect, test } from '@playwright/test'

test.describe('lightweight public header', () => {
  test.skip(process.env.BRAND !== 'alquilatucarro', 'C5b header split is Alquilatucarro-scoped')

  test('mobile navigation is interaction-rendered, focusable, and Escape-dismissable', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/bogota')

    const dialog = page.getByRole('dialog', { name: 'Menú de navegación' })
    await expect(dialog).toHaveCount(0)

    await page.getByRole('button', { name: 'Abrir menú de navegación' }).click()
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toBeFocused()
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden')

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('')

    expect(consoleErrors.filter((message) => /hydration|mismatch/i.test(message))).toEqual([])
  })
})
