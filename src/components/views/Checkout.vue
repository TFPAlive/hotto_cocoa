<script setup lang="ts">
import Index from '../checkout/Index.vue'
import { onMounted } from 'vue';

onMounted(() => {
    document.title = "Checkout | Hotto Choco"
});
</script>

<template>
    <Index />
</template>