<template>
  <div class="flex items-center justify-center gap-6">
    <button
      class="w-[60px] h-[60px] max-sm:w-[50px] max-sm:h-[50px] rounded-full bg-bg-secondary ring-1 ring-white/10 text-2xl max-sm:text-xl font-bold text-text-primary cursor-pointer transition-all duration-100 hover:not-disabled:bg-bg-elevated hover:not-disabled:ring-accent disabled:opacity-30 disabled:cursor-not-allowed"
      :disabled="ballCount <= 0"
      @click="decrementBalls"
    >
      -
    </button>
    <span class="text-4xl max-sm:text-3xl font-bold min-w-[80px] max-sm:min-w-[60px] text-center">{{ ballCount }}</span>
    <button
      class="w-[60px] h-[60px] max-sm:w-[50px] max-sm:h-[50px] rounded-full bg-bg-secondary ring-1 ring-white/10 text-2xl max-sm:text-xl font-bold text-text-primary cursor-pointer transition-all duration-100 hover:not-disabled:bg-bg-elevated hover:not-disabled:ring-accent disabled:opacity-30 disabled:cursor-not-allowed"
      :disabled="ballCount >= maxBalls"
      @click="incrementBalls"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  ballCount: number
  maxBalls: number
}

interface Emits {
  increment: []
  decrement: []
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function incrementBalls() {
  emit('increment')
}

function decrementBalls() {
  emit('decrement')
}
</script>