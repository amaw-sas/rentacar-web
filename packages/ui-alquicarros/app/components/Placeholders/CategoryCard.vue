<template>
  <!-- Skeleton de la tarjeta de vehículo mientras cargan las gamas tras una
       búsqueda. Solo bloques USkeleton (shimmer), sin texto ni cajas de color
       planas, para que se lea como "cargando" y no como una tarjeta a medias. -->
  <div class="categoria flex flex-col w-full">
    <!-- Imagen / carrusel -->
    <USkeleton class="w-full h-70 rounded-b-none rounded-t-sm" />

    <!-- Cabecera: gama + descripción + chevron -->
    <div class="bg-white w-full flex items-center justify-between gap-3 px-4 py-4">
      <div class="flex flex-col gap-2 flex-1">
        <USkeleton class="h-4 w-28" />
        <USkeleton class="h-3 w-44" />
      </div>
      <USkeleton class="h-6 w-6 rounded-full shrink-0" />
    </div>

    <!-- Cuerpo: tarifa (izq) + protección (der) -->
    <div class="bg-white w-full px-4 pb-4 space-y-4">
      <div class="flex gap-4">
        <div class="flex flex-col gap-2 flex-1">
          <USkeleton class="h-3 w-24" />
          <USkeleton class="h-7 w-28" />
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-3 w-16" />
        </div>
        <div class="flex flex-col gap-2 flex-1">
          <USkeleton class="h-3 w-28" />
          <USkeleton class="h-5 w-full" />
          <USkeleton class="h-5 w-full" />
        </div>
      </div>

      <!-- Servicios adicionales -->
      <USkeleton class="h-11 w-full rounded-sm" />

      <!-- CTA "Solicitar este vehículo" -->
      <USkeleton class="h-12 w-full rounded-sm" />
    </div>
  </div>
</template>
