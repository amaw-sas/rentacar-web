/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/plugins/**/*.{js,ts}',
    './app/composables/**/*.{vue,js,ts}',
    './app/middleware/**/*.{vue,js,ts}',
    './app/app.vue',
    './app/error.vue',
    './node_modules/@nuxt/ui/**/*.{vue,js,ts}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

