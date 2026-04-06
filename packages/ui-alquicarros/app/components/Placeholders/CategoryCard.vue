<template>
  <div class="categoria flex flex-col w-full">
    <USkeleton class="w-full h-70 rounded-b-none rounded-t-sm"></USkeleton>
    <div class="bg-white w-full h-20 flex items-center justify-between px-3">
      <div class="flex flex-col">
        <span class="font-bold">Gama</span>
        <span class="text-gray-600">Descripción</span>
      </div>
      <UIcon name="i-heroicons-chevron-down-solid" class="size-5 float-right text-gray-600"></UIcon>
    </div>
    <div class="bg-gray-200 w-full h-50 content-end space-y-2 px-3 pb-3">
        <div class="w-full bg-gray-100 rounded-sm p-2 flex items-center justify-between">
          <span class="font-bold place-self-center">Adicionales:</span>
          <Icon name="i-heroicons-chevron-down-solid" class="float-right text-gray-600"></Icon>
        </div>
        <UButton disabled loading class="boton-seleccion">Solicitar este vehiculo</UButton>
    </div>
  </div>
</template>