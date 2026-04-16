<template>
    <u-form 
        class="w-full mx-auto md:w-3/6 lg:w-4/6 grid grid-cols-2 auto-rows-min gap-2 light"
    >
        <div class="col-span-2 bg-white rounded-xl p-2 shadow-sm">
            <u-form-field label="Lugar de recogida" size="xl">
                <u-progress class="w-full py-3" v-model="progress" />
            </u-form-field>
        </div>
        <div class="col-span-2 bg-white rounded-xl p-2 shadow-sm">
            <u-form-field label="Lugar de devolución" size="xl">
                <u-progress class="w-full py-3" v-model="progress" />
            </u-form-field>
        </div>
        <div class="bg-white rounded-xl p-2 shadow-sm">
            <u-form-field label="Día de recogida" size="xl">
                <u-progress class="w-full py-3" v-model="progress" />
            </u-form-field>
        </div>
        <div class="bg-white rounded-xl p-2 shadow-sm">
            <u-form-field label="Día de devolución" size="xl">
                <u-progress class="w-full py-3" v-model="progress" />
            </u-form-field>
        </div>
        <div class="bg-white rounded-xl p-2 shadow-sm">
            <u-form-field label="Hora de recogida" size="xl">
                <u-progress class="w-full py-3" v-model="progress" />
            </u-form-field>
        </div>
        <div class="bg-white rounded-xl p-2 shadow-sm">
            <u-form-field label="Hora de devolución" size="xl">
                <u-progress class="w-full py-3" v-model="progress" />
            </u-form-field>
        </div>
        <div class="col-span-2">
            <u-button
                type="submit"
                class="search-button"
                size="xl"
                disabled
            >
                BUSCAR VEHÍCULOS
            </u-button>
        </div>
    </u-form>
</template>

<script setup lang="ts">
const progress = ref(null);
</script>
