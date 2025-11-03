<script setup lang="ts">
import { onMounted } from 'vue';
import DrinkDetail from '@/components/drink/DrinkDetail.vue';

onMounted(() => {
    document.title = "Drink Details | Hotto Choco"
});
</script>

<template>
    <div class="drink-detail-view">
        <DrinkDetail />
    </div>
</template>

<style scoped>
.drink-detail-view {
    min-height: 100vh;
    background: #faf8f5;
}
</style>