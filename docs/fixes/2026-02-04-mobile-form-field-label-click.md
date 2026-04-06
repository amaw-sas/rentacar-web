# Fix: Mobile Form Field Label Click Bug

**Fecha:** 2026-02-04
**Componente:** `Searcher.vue`
**Branches afectadas:** `packages/ui-alquilatucarro`, `packages/ui-alquicarros`, `packages/ui-alquilame`

## Problema

En vista móvil del componente Searcher, hacer clic en el label de un form-field activaba
componentes Nuxt UI de escritorio que deberían estar ocultos con CSS (`display: none`).

**Reproducción:**
1. Abrir página de ciudad (ej: /armenia) en viewport móvil (375px width)
2. Hacer clic en label "Lugar de recogida"
3. BUG: Se abre el dropdown de u-select-menu (componente desktop) en lugar del select nativo

## Root Cause

`u-form-field` de Nuxt UI genera un `<label for="id">` que automáticamente busca y
se asocia con el primer control de formulario dentro. Cuando hay DOS controles dentro del
mismo form-field (uno para móvil con clases responsive `sm:hidden` y otro para desktop
con `hidden sm:block`), el label se asocia inconsistentemente, causando que clicks en
móvil activen componentes desktop ocultos con CSS.

## Solución

Duplicar `u-form-field` completo: uno para móvil y otro para desktop, cada uno con su
propia visibilidad responsive:

```vue
<!-- MÓVIL -->
<div class="... sm:hidden">
    <u-form-field label="Campo">
        <select id="campo-mobile" ...>
    </u-form-field>
</div>

<!-- DESKTOP -->
<div class="... hidden sm:block">
    <u-form-field label="Campo">
        <u-select-menu id="campo" ...>
    </u-form-field>
</div>
```

**Ventajas:**
- Cada form-field tiene UN solo input
- Los labels se asocian correctamente con su input correspondiente
- No hay interferencia entre viewports
- Mantiene la intención original (inputs nativos en móvil para mejor UX)

## Testing

Test e2e agregado: `e2e/searcher-mobile-label-click.spec.ts`

Verifica:
1. Hacer clic en label en móvil NO activa componentes desktop
2. Hacer clic en label en móvil activa solo el input móvil correcto
3. El elemento activo después del click es el input móvil

## Archivos modificados

- `packages/ui-alquilatucarro/app/components/Searcher.vue`
- `packages/ui-alquicarros/app/components/Searcher.vue`
- `packages/ui-alquilame/app/components/Searcher.vue`
- `e2e/searcher-mobile-label-click.spec.ts` (nuevo test)

## Lecciones aprendidas

1. **u-form-field asume un solo control:** Cuando Nuxt UI u-form-field tiene múltiples
   inputs dentro, el comportamiento del label es impredecible.

2. **CSS display:none no previene activación programática:** Elementos con `display: none`
   aún pueden recibir foco/activación si el label apunta a ellos via atributo `for`.

3. **Responsive patterns con formularios:** Al tener versiones móvil/desktop de inputs,
   duplicar el form-field completo es más robusto que tener múltiples inputs en uno solo.
