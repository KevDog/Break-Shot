<template>
  <section v-if="gameStatus === 'active' && !needsRerack && !awaitingFoulOption" class="flex flex-col gap-6">
    <!-- Turn indicator -->
    <div class="text-center text-lg font-semibold" :class="isMyTurn ? 'text-accent' : 'text-text-secondary'">
      <template v-if="isMyTurn">
        {{ $t('game.yourTurn') }}
      </template>
      <template v-else>
        {{ currentTurnPlayerName }}'s turn
      </template>
    </div>

    <!-- Scoring controls only shown to the player whose turn it is -->
    <template v-if="isMyTurn">
      <!-- Ball count input -->
      <ScoreInput 
        :ball-count="ballCount" 
        :max-balls="remainingBallsInRack"
        @increment="$emit('increment-balls')"
        @decrement="$emit('decrement-balls')"
      />

      <!-- Action buttons -->
      <div class="flex flex-col gap-4">
        <button
          class="btn btn--primary btn--large w-full min-h-[56px]"
          :disabled="ballCount === 0 || ballCount > remainingBallsInRack"
          @click="$emit('score-balls')"
        >
          {{ $t('game.ballsMade') }} ({{ ballCount }})
        </button>

        <!-- End of Turn grouped box -->
        <div class="p-4 bg-bg-secondary rounded-xl ring-1 ring-white/10">
          <h3 class="text-sm font-medium text-text-secondary mb-3 text-center">End of Turn</h3>
          <div class="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <button
              class="btn btn--secondary w-full min-h-[56px]"
              @click="$emit('miss')"
            >
              Miss
            </button>
            <button
              class="btn btn--secondary w-full min-h-[56px]"
              @click="$emit('scratch')"
            >
              {{ $t('game.scratch') }}
            </button>
            <button
              class="btn btn--secondary w-full min-h-[56px]"
              @click="$emit('foul')"
            >
              {{ $t('game.foul') }}
            </button>
            <button
              class="btn btn--secondary w-full min-h-[56px]"
              @click="$emit('safety')"
            >
              {{ $t('game.safety') }}
            </button>
          </div>
        </div>

        <!-- Rerack button (only shown when 14 balls made) -->
        <div v-if="ballsInCurrentRack >= 14" class="grid grid-cols-1 gap-4">
          <button
            class="btn btn--secondary w-full min-h-[56px]"
            @click="$emit('rerack')"
          >
            {{ $t('game.rerack') }}
          </button>
        </div>
      </div>
    </template>

    <!-- Waiting message for opponent's turn -->
    <template v-else>
      <div class="flex flex-col items-center gap-4 p-8 bg-bg-secondary rounded-2xl ring-1 ring-white/10">
        <div class="animate-bounce-dots flex gap-1">
          <span class="bg-accent" />
          <span class="bg-accent" />
          <span class="bg-accent" />
        </div>
        <p class="text-sm/6 text-text-secondary m-0">Waiting for {{ currentTurnPlayerName }} to play...</p>
      </div>
    </template>

    <!-- Secondary actions (always visible) -->
    <div class="flex justify-center gap-6 pt-4 border-t border-white/10">
      <button
        class="btn btn--ghost"
        :disabled="!canUndo"
        @click="$emit('undo')"
      >
        {{ $t('game.undo') }}
      </button>
      <button class="btn btn--ghost text-error hover:bg-error/10" @click="$emit('show-end-game')">
        {{ $t('game.endGame') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import ScoreInput from './ScoreInput.vue'

interface Props {
  gameStatus: string
  needsRerack: boolean
  awaitingFoulOption: boolean
  isMyTurn: boolean
  currentTurnPlayerName: string
  ballCount: number
  remainingBallsInRack: number
  ballsInCurrentRack: number
  canUndo: boolean
}

interface Emits {
  'increment-balls': []
  'decrement-balls': []
  'score-balls': []
  'miss': []
  'scratch': []
  'foul': []
  'safety': []
  'rerack': []
  'undo': []
  'show-end-game': []
}

defineProps<Props>()
defineEmits<Emits>()
</script>