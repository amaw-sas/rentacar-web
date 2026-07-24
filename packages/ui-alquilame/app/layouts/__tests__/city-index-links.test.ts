/**
 * Auditoría de enlaces de la landing de ciudad ([city]/index.vue) — correcciones.
 *
 * Static-source assertions que codifican el contrato observable (verificación
 * runtime hecha en el navegador real de Orca: perfiles sociales y scroll del nav):
 *
 *   - SCEN-LINK-01: en una página de ciudad el nav "Ciudades" ancla a
 *     #ciudades-cercanas (la sección real de CitySeoContent), NO a #cities
 *     (HomeCities no se renderiza en la landing de ciudad → ancla rota antes).
 *   - SCEN-LINK-02: el resaltado activo del nav reconoce #ciudades-cercanas.
 *   - SCEN-LINK-03: la sección destino #ciudades-cercanas existe en CitySeoContent.
 *   - SCEN-LINK-04: los enlaces sociales apuntan a los perfiles REALES verificados
 *     (facebook.com/alquilameco, instagram.com/alquilamecol, youtube @alquilameco)
 *     y NUNCA a los handles rotos (alquilamecom / alquilame.com / youtube @alquilame).
 *   - SCEN-LINK-05: TikTok @alquilame (perfil válido) se conserva.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..') // → packages/ui-alquilame
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8')

describe('city landing — nav anchor "Ciudades"', () => {
  const layout = read('app/layouts/default.vue')

  it('SCEN-LINK-01: en city el destino de "Ciudades" es #ciudades-cercanas', () => {
    // El destino se decide por route.params.city (la forma exacta del computed
    // —ternario o if/return— es libre; lo observable es la condición y el destino).
    expect(layout).toContain('#ciudades-cercanas')
    expect(layout).toMatch(/route\.params\.city[\s\S]{0,60}#ciudades-cercanas/)
  })

  it('SCEN-LINK-02: el estado activo reconoce #ciudades-cercanas', () => {
    expect(layout).toMatch(/citiesActive[\s\S]*#ciudades-cercanas/)
  })

  it('SCEN-LINK-03: la sección destino existe en CitySeoContent', () => {
    expect(read('app/components/city/SeoContent.vue')).toContain('id="ciudades-cercanas"')
  })
})

describe('city landing — enlaces sociales (footer, config-driven)', () => {
  const config = read('app/app.config.ts')

  it('SCEN-LINK-04: apuntan a los perfiles reales verificados', () => {
    expect(config).toContain('https://www.facebook.com/alquilameco')
    expect(config).toContain('https://www.instagram.com/alquilamecol')
    expect(config).toContain('https://www.youtube.com/@alquilameco')
  })

  it('SCEN-LINK-04b: no quedan los handles rotos', () => {
    expect(config).not.toContain('facebook.com/alquilamecom')
    expect(config).not.toContain('instagram.com/alquilame.com')
    // youtube roto era @alquilame (sin "co"); tiktok @alquilame es válido → check exacto
    expect(config).not.toMatch(/youtube\.com\/@alquilame"/)
  })

  it('SCEN-LINK-05: TikTok @alquilame (válido) se conserva', () => {
    expect(config).toContain('https://www.tiktok.com/@alquilame')
  })
})

describe('city landing — CTA y "Inicio" del footer', () => {
  const layout = read('app/layouts/default.vue')

  it('SCEN-LINK-06: "Reserva Ahora" de Requirements va a /reservas interno', () => {
    const req = read('app/components/home/Requirements.vue')
    expect(req).toContain('to="/reservas"')
    // ya no salta al home externo (reservation.website)
    expect(req).not.toContain('reservation.website')
  })

  it('SCEN-LINK-07: "Inicio" del footer usa heroTo (en city ancla al hero de esa ciudad)', () => {
    // el enlace Inicio del footer no debe quedar hardcodeado a /#hero (home)
    expect(layout).not.toContain('to="/#hero"')
    expect(layout).toMatch(/:to="heroTo"[\s\S]{0,80}>Inicio</)
  })

  it('SCEN-LINK-09: el footer ofrece el convenio B2B apuntando a su página propia', () => {
    // El público son rentadoras, no un particular con un carro: la etiqueta lo
    // dice para no atraer al lead equivocado.
    const config = read('app/app.config.ts')
    expect(config).toContain('/aliados')
    expect(config).toMatch(/label:\s*"Sé nuestro aliado"/)
  })

  it('SCEN-LINK-10: /aliados es una landing con formulario (ya no un placeholder)', () => {
    // Contrato actualizado: dejó de ser "En construcción" y pasó a captar datos.
    const page = read('app/pages/aliados.vue')
    expect(page).not.toMatch(/En construcci[óo]n/)
    expect(page).toMatch(/<PublicContactForm[\s\S]*type="flota"/)
  })

  it('SCEN-FORM-07: "Quejas y reclamos" apunta a la página propia, no al Google Form con login', () => {
    const config = read('app/app.config.ts')
    expect(config).toContain('/quejas-y-reclamos')
    expect(config).not.toContain('docs.google.com/forms')
  })

  it('SCEN-FORM-08: /quejas-y-reclamos existe y monta el formulario de quejas', () => {
    const page = read('app/pages/quejas-y-reclamos.vue')
    expect(page).toMatch(/<PublicContactForm[\s\S]*type="quejas"/)
  })

  it('SCEN-LINK-08: todo href tel: quita los espacios del número (footer y ChatWidget)', () => {
    const chat = read('app/components/ChatWidget.vue')
    // Ambos surfaces deben limpiar espacios → tel:+573002436677 (no "+57 300 …").
    expect(layout).toMatch(/tel:\$\{franchise\.phone\.replace\(\/\\s\/g/)
    expect(chat).toMatch(/tel:\$\{franchise\.phone\.replace\(\/\\s\/g/)
    // Ningún tel: debe usar franchise.phone crudo (con espacios).
    expect(chat).not.toMatch(/tel:\$\{franchise\.phone\}/)
  })
})
