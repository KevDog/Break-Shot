<template>
  <section class="grid grid-cols-[1fr_auto_1fr] gap-4 bg-bg-secondary rounded-2xl p-6 ring-1 ring-white/10 max-sm:grid-cols-2 max-sm:grid-rows-[auto_auto]">
    <!-- Player 1 -->
    <div
      class="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-100"
      :class="{
        'bg-bg-elevated ring-2 ring-accent': isPlayer1Turn,
        'bg-success/10 ring-2 ring-success': winnerId === player1Id,
      }"
      data-testid="player1-section"
    >
      <span
        class="text-sm/6 font-medium"
        :class="isPlayer1Turn ? 'text-accent' : 'text-text-secondary'"
        data-testid="player1-name"
      >
        {{ player1Name }}
      </span>
      <div class="flex items-baseline gap-3">
        <div class="flex flex-col items-center">
          <span class="text-4xl font-bold leading-none" data-testid="player1-total">{{ player1Total }}</span>
          <span class="text-xs text-text-muted">Total</span>
        </div>
        <span class="text-2xl text-text-muted">+</span>
        <div class="flex flex-col items-center">
          <span class="text-4xl font-bold leading-none text-accent" data-testid="player1-rack">{{ player1Rack }}</span>
          <span class="text-xs text-text-muted">Rack</span>
        </div>
      </div>
      <div class="flex flex-col items-center gap-0.5 text-xs text-text-muted">
        <span data-testid="player1-run">Run: {{ player1Run }}</span>
        <span v-if="player1Fouls > 0" class="text-warning" data-testid="player1-fouls">
          Fouls: {{ player1Fouls }}
        </span>
      </div>
    </div>

    <!-- Game info -->
    <div class="flex flex-col items-center justify-center gap-1 px-2 text-xs text-text-secondary max-sm:col-span-2 max-sm:flex-row max-sm:justify-around max-sm:order-first max-sm:pb-4 max-sm:px-0 max-sm:border-b max-sm:border-white/10">
      <span data-testid="target-score">Score: {{ targetScore }}</span>
      <span data-testid="inning">Inning: {{ inning }}</span>
      <span data-testid="racks">Racks: {{ racks }}</span>
    </div>

    <!-- Player 2 -->
    <div
      class="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-100"
      :class="{
        'bg-bg-elevated ring-2 ring-accent': !isPlayer1Turn,
        'bg-success/10 ring-2 ring-success': winnerId === player2Id,
      }"
      data-testid="player2-section"
    >
      <span
        class="text-sm/6 font-medium"
        :class="!isPlayer1Turn ? 'text-accent' : 'text-text-secondary'"
        data-testid="player2-name"
      >
        {{ player2Name }}
      </span>
      <div class="flex items-baseline gap-3">
        <div class="flex flex-col items-center">
          <span class="text-4xl font-bold leading-none max-sm:text-3xl" data-testid="player2-total">{{ player2Total }}</span>
          <span class="text-xs text-text-muted">Total</span>
        </div>
        <span class="text-2xl text-text-muted">+</span>
        <div class="flex flex-col items-center">
          <span class="text-4xl font-bold leading-none max-sm:text-3xl text-accent" data-testid="player2-rack">{{ player2Rack }}</span>
          <span class="text-xs text-text-muted">Rack</span>
        </div>
      </div>
      <div class="flex flex-col items-center gap-0.5 text-xs text-text-muted">
        <span data-testid="player2-run">Run: {{ player2Run }}</span>
        <span v-if="player2Fouls > 0" class="text-warning" data-testid="player2-fouls">
          Fouls: {{ player2Fouls }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  player1Name: string
  player1Id: string
  player1Total: number
  player1Rack: number
  player1Run: number
  player1Fouls: number
  player2Name: string
  player2Id: string
  player2Total: number
  player2Rack: number
  player2Run: number
  player2Fouls: number
  isPlayer1Turn: boolean
  targetScore: number
  inning: number
  racks: number
  winnerId?: string
}

defineProps<Props>()
</script>
