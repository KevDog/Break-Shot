<template>
  <div
    class="flex flex-col items-center justify-center p-6 bg-bg-secondary rounded-2xl ring-1"
    :class="{
      'ring-warning': remainingBalls <= 3 && !needsRerack,
      'ring-accent bg-accent/10': needsRerack,
      'ring-white/10': remainingBalls > 3 && !needsRerack,
    }"
  >
    <span
      class="text-4xl font-bold leading-none"
      :class="{
        'text-warning': remainingBalls <= 3 && !needsRerack,
        'text-accent': needsRerack,
        'text-text-primary': remainingBalls > 3 && !needsRerack,
      }"
    >
      {{ remainingBalls }}
    </span>
    <span class="text-sm/6 text-text-secondary mt-1">Balls Remaining</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  remainingBalls: number
  needsRerack: boolean
}

defineProps<Props>()
</script>