<template>
  <div class="flex flex-row items-center justify-center space-x-0.5 text-white text-center">
    <svg v-for="i in 5" :key="i" xmlns="http://www.w3.org/2000/svg" width="10" height="10" class="w-2.5 h-2.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
    <span class="ml-2 text-xs md:text-base">4.9 reviews</span>
  </div>
</template>
