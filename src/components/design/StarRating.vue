<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps<{ modelValue: number }>()
const emit = defineEmits(['update:modelValue'])

const starTypes = computed(() => {
  const types: string[] = []
  for (let i = 1; i <= 5; i++) {
    if (props.modelValue >= i) types.push('full')
    else if (props.modelValue >= i - 0.5) types.push('half')
    else types.push('empty')
  }
  return types
})

function setRating(val: number) {
  emit('update:modelValue', val)
}
</script>

<template>
  <span class="star-rating">
    <span
      v-for="(type, idx) in starTypes"
      :key="idx"
      class="star"
      @click="setRating(idx + 1)"
    >
      <template v-if="type === 'full'">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#a0522d" stroke="none">
          <polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9"/>
        </svg>
      </template>
      <template v-else-if="type === 'half'">
        <svg width="24" height="24" viewBox="0 0 24 24" stroke="none">
          <defs>
            <linearGradient id="halfGrad">
              <stop offset="50%" stop-color="#a0522d"/>
              <stop offset="50%" stop-color="lightgray"/>
            </linearGradient>
          </defs>
          <polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9" fill="url(#halfGrad)"/>
        </svg>
      </template>
      <template v-else>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="lightgray" stroke="none">
          <polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9"/>
        </svg>
      </template>
    </span>
  </span>
</template>

<style scoped>
.star-rating {
  display: flex;
  gap: 4px;
  cursor: pointer;
}
.star {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}
</style>
