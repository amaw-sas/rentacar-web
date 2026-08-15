<template>
  <!--
    El conteo de sedes sale de los datos, no del markup. Estuvo escrito "27" y
    para agosto de 2026 ya eran 31: nadie se equivocó al escribirlo, es que un
    literal no puede seguir siendo cierto. Mismo patrón que useCityCount.
  -->
  <p class="text-base text-white">
    Contamos con {{ branchCount }} sedes a nivel nacional y una excelente
    reputaci&oacute;n en alquiler de carros y camionetas que se adaptan a tu
    necesidad y presupuesto
  </p>
</template>

<script setup lang="ts">
const branchCount = useBranchCount()
</script>
