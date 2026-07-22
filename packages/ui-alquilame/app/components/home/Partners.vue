<template>
  <!--
    Partners "Empresas Aliadas" — aligned with the reference design.

    History worth keeping: this section used to be a scrolling marquee of TEXT
    wordmarks, because at port time the design shipped no logo assets. It does
    now (public/images/partners/*.svg), so the section became what the reference
    actually renders: a STATIC centred row of real logos. No marquee, no
    duplicate copy — so no aria-hidden clone and no reduced-motion accommodation
    to make, because nothing moves.

    The logos are dark-on-transparent SVGs; `brightness-0 invert` flattens them
    to pure white so they read over the red band, exactly as the reference does.
    Each keeps its ally name as alt text — the names used to be literal text, and
    turning them into images would otherwise drop them for screen readers.

    Gradient guard (F0 lesson): the section uses the v4 bg-linear-to-* utility,
    never the broken v3 alias (which renders background-image:none against custom
    @theme tokens). The design's #CB032C → #A00425 maps exactly to our
    footer-from / footer-to tokens.
  -->
  <section
    id="partners"
    class="py-12 md:py-16 bg-linear-to-b from-footer-from to-footer-to [--ctx-text-primary:#fff]"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- A real <h2>, at the same scale as every other section heading. This
           used to be a small uppercase <p>, which left the section with no
           heading element at all: assistive tech could not jump to it and
           crawlers saw an untitled block. -->
      <h2 class="text-center text-3xl md:text-4xl font-extrabold font-heading text-white">
        Empresas Aliadas
      </h2>
      <p class="mx-auto mt-4 mb-10 max-w-2xl text-center text-base text-white/80">
        Nos apoyamos en una red de aliados para darte más vehículos disponibles,
        en más ciudades y fechas.
      </p>

      <div class="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-16">
        <div v-for="ally in allies" :key="ally.name">
          <img
            :src="ally.logo"
            :alt="ally.name"
            height="36"
            loading="lazy"
            decoding="async"
            class="h-7 w-auto opacity-80 brightness-0 invert transition-opacity duration-300 hover:opacity-100 md:h-9"
          >
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Ally {
  name: string
  logo: string
}

// Ally logos vendored from the reference design. Order matches its #partners row.
const allies: ReadonlyArray<Ally> = [
  { name: 'Localiza', logo: '/images/partners/localiza.svg' },
  { name: 'Avis', logo: '/images/partners/avis.svg' },
  { name: 'Alquicarros', logo: '/images/partners/alquicarros.svg' },
  { name: 'Alquilatucarro', logo: '/images/partners/alquilatucarro.svg' },
]
</script>
