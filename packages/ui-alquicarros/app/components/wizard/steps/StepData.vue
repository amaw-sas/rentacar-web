<template>
  <!--
    Paso 5 — Datos. Reúsa el ReservationForm existente (validación valibot intacta)
    y enruta el submit por submitForm del store → routeForReservationStatus, sin
    regresión (SCEN-W-11). Expone submit() para que el CTA "Confirmar reserva" del
    sidebar dispare la validación + envío del formulario.
  -->
  <div>
    <header class="mb-5">
      <h2 class="heading-card text-gray-900">Tus datos para reservar</h2>
      <p class="mt-1 body-base text-gray-500">
        Completa los datos del titular de la tarjeta de crédito. Revisa el total en
        el resumen antes de confirmar.
      </p>
    </header>

    <div class="rounded-2xl border border-gray-200 bg-white p-5">
      <ReservationForm ref="formRef" @submit="onSubmit" />
    </div>
  </div>
</template>

<script setup lang="ts">
// External
import { ref } from 'vue'

// Types
import type { ReservationFormValidationSchemaType } from '@rentacar-main/logic/utils'

const form = useStoreReservationForm()
const { submitForm } = form

// ReservationForm expone submit() (defineExpose) que dispara la validación valibot;
// solo emite @submit cuando el formulario es válido.
const formRef = ref<{ submit: () => void } | null>(null)

function onSubmit(data: ReservationFormValidationSchemaType): void {
  // submitForm ignora su argumento (lee del store); se pasa por paridad con el
  // contrato @submit del ReservationForm que usa CategorySelectionSection.
  submitForm(data as never)
}

/** Dispara la validación + envío del ReservationForm desde el CTA del sidebar. */
function submit(): void {
  formRef.value?.submit()
}

defineExpose({ submit })
</script>
