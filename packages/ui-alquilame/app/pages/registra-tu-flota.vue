<template>
  <!--
    "Registra tu Flota" — placeholder EN CONSTRUCCIÓN.

    La página existe para que el enlace del footer tenga destino propio de la
    marca (nunca apuntar a otra franquicia). Mientras se construye el formulario
    real, ofrecemos el canal de contacto que ya existe (franchise.whatsapp, NUNCA
    un wa.me hardcodeado) para no perder al propietario interesado.

    noindex: es un placeholder; no debe entrar al índice hasta tener contenido.
    Estado de marca: fondo oscuro/rojo → [--ctx-text-primary:#fff] mantiene los
    .heading-* en blanco.
  -->
  <div class="text-white max-w-2xl mx-auto text-center py-12 px-4 [--ctx-text-primary:#fff]">
    <!-- Icono de herramientas (#ff8a00 — semántica "en obra") -->
    <div class="pb-4 flex justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="64px" height="64px" fill="#ff8a00" aria-hidden="true">
        <path d="M78.6 5C69.1-2.4 55.6-1.5 47 7L7 47c-8.5 8.5-9.4 22-2.1 31.6l80 104c4.5 5.9 11.6 9.4 19 9.4l54.1 0 87 87c-7.4 14.6-11.1 30.6-11.1 46.6c0 27.5 10.5 55 31.5 76c34 34 84.5 41 125.5 21l-84.9-84.9c-6.2-6.2-6.2-16.4 0-22.6l25.4-25.4c6.2-6.2 16.4-6.2 22.6 0l84.9 84.9c20-41 13-91.5-21-125.5c-21-21-48.5-31.5-76-31.5c-16 0-32 3.7-46.6 11.1l-87-87 0-54.1c0-7.5-3.5-14.5-9.4-19L78.6 5z"/>
      </svg>
    </div>

    <!-- Título -->
    <h1 class="heading-page mb-4">En construcción</h1>
    <div class="h-1 w-10 rounded-full bg-red-600 mb-8 mx-auto" aria-hidden="true" />

    <!-- Mensaje principal -->
    <p class="text-lg text-white/80 mb-8">
      Estamos preparando el espacio para que registres tu flota con nosotros.<br>
      Muy pronto podrás hacerlo aquí mismo.
    </p>

    <!-- Canal disponible mientras tanto -->
    <div class="bg-white/10 rounded-2xl p-6 mb-6">
      <h2 class="heading-sub mb-4">¿Quieres registrar tu flota ya?</h2>
      <p class="text-white/80 mb-5">
        Escríbenos y te acompañamos en el proceso.
      </p>
      <a
        :href="franchise.whatsapp"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-whatsapp text-black font-semibold shadow-lg shadow-black/25 hover:-translate-y-0.5 transition-all duration-200"
        aria-label="Escribir por WhatsApp para registrar mi flota"
      >
        Escríbenos por WhatsApp
      </a>
    </div>

    <NuxtLink to="/" class="text-white/70 hover:text-white text-sm transition-colors">
      Volver al inicio
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const { franchise } = useAppConfig()

useHead({
  title: 'Registra tu Flota',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

useSeoMeta({
  description: 'Muy pronto podrás registrar tu flota con nosotros. Escríbenos por WhatsApp si quieres empezar ahora.',
})
</script>
