<template>
  <div
    class="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-100"
    :class="{
      'bg-bg-elevated ring-2 ring-accent': isCurrentTurn,
      'bg-success/10 ring-2 ring-success': isWinner,
    }"
  >
    <span class="text-sm/6 font-medium" :class="isCurrentTurn ? 'text-accent' : 'text-text-secondary'">
      {{ player?.name || playerLabel }}
    </span>
    <div class="flex items-baseline gap-3">
      <div class="flex flex-col items-center">
        <span class="text-4xl font-bold leading-none max-sm:text-3xl">{{ playerState?.totalScore || 0 }}</span>
        <span class="text-xs text-text-muted">Total</span>
      </div>
      <span class="text-2xl text-text-muted">+</span>
      <div class="flex flex-col items-center">
        <span class="text-4xl font-bold leading-none max-sm:text-3xl text-accent">{{ playerState?.rackScore || 0 }}</span>
        <span class="text-xs text-text-muted">Rack</span>
      </div>
    </div>
    <div class="flex flex-col items-center gap-2 text-base">
      <div v-if="playerState" class="flex items-center gap-3 px-4 py-2 bg-bg-secondary rounded-lg">
        <span class="text-text-secondary text-sm uppercase tracking-wide">Run:</span>
        <span class="font-semibold text-text-primary text-lg">{{ playerState.currentRun }}</span>
      </div>
      <div v-if="playerState && playerState.consecutiveFouls > 0" class="flex items-center gap-3 px-4 py-2 bg-warning/10 rounded-lg ring-1 ring-warning/20">
        <span class="text-warning text-sm uppercase tracking-wide font-medium">Fouls:</span>
        <span class="font-bold text-warning text-lg">{{ playerState.consecutiveFouls }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player, PlayerState } from '~~/shared/types'

interface Props {
  player?: Player | null
  playerState?: PlayerState | null
  isCurrentTurn?: boolean
  isWinner?: boolean
  playerLabel: string
}

defineProps<Props>()
</script>