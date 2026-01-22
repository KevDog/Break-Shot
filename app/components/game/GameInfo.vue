<template>
  <div class="flex flex-col items-center justify-center gap-2 px-4 text-sm text-text-secondary max-sm:col-span-2 max-sm:flex-row max-sm:justify-around max-sm:order-first max-sm:pb-6 max-sm:px-0 max-sm:border-b max-sm:border-white/10">
    <div class="flex flex-col items-center gap-1">
      <span class="text-xs uppercase tracking-wide">{{ $t('game.score') }}</span>
      <span class="text-lg font-semibold text-text-primary">{{ targetScore }}</span>
    </div>
    <div class="flex flex-col items-center gap-1">
      <span class="text-xs uppercase tracking-wide">{{ $t('game.inning') }}</span>
      <span class="text-lg font-semibold text-text-primary">{{ currentInning || 1 }}</span>
    </div>
    <div class="flex flex-col items-center gap-1">
      <span class="text-xs uppercase tracking-wide">{{ $t('game.racks') }}</span>
      <span class="text-lg font-semibold text-text-primary">{{ rerackCount || 0 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  targetScore: number
  currentInning: number
  rerackCount: number
}

defineProps<Props>()
</script>