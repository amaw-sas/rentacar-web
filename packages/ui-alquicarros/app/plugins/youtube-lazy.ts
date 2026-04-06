// plugins/youtube-lazy.ts

import { defineNuxtPlugin } from '#app';
import type { DirectiveBinding } from 'vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('youtube-lazy', {
    mounted(el: HTMLImageElement, binding: DirectiveBinding<string>) {
      // Note: cursor-pointer class should be added in template to avoid hydration mismatch

      const loadVideo = () => {
        const videoId = binding.value;
        if (!videoId) {
          console.warn('No se proporcionó un ID de video para la directiva v-youtube-lazy');
          return;
        }

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`; // autoplay=1 para reproducir automáticamente, rel=0 para evitar videos relacionados
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('class','aspect-video');

        // Reemplaza la imagen con el iframe
        if (el.parentNode) {
          el.parentNode.replaceChild(iframe, el);
        }
      };

      el.addEventListener('click', loadVideo);
    },
  });
});