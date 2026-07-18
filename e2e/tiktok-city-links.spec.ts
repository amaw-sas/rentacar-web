import { expect, test } from '@playwright/test'

test.describe('/tiktok campaign city links', () => {
  test('SSR and hydrated runtime both render the 16 branch-aware city links', async ({ page }) => {
    const documentResponse = await page.request.get('/tiktok')
    const documentHtml = await documentResponse.text()

    expect(documentResponse.status()).toBe(200)
    expect(documentHtml.match(/class="tt-city"/g)).toHaveLength(16)

    await page.goto('/tiktok')

    const links = page.locator('a.tt-city')
    await expect(links).toHaveCount(16)

    await expect
      .poll(async () => {
        const hrefs = await links.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('href')),
        )
        return (
          hrefs.length === 16 &&
          new Set(hrefs).size === 16 &&
          hrefs.every((href) => href?.includes('/buscar-vehiculos/'))
        )
      })
      .toBe(true)
  })
})
