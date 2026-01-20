<template>
  <div>
    <!-- Consecutive foul warning -->
    <div
      v-if="showFoulWarning"
      class="alert text-center mb-6"
      :class="consecutiveFouls === 2 ? 'alert--error font-semibold' : 'bg-warning/10 text-warning ring-warning/20'"
    >
      {{ $t('warnings.consecutiveFouls', { count: consecutiveFouls }) }}
    </div>

    <!-- Opening break foul option -->
    <div v-if="awaitingFoulOption" class="text-center p-8 bg-bg-secondary rounded-2xl ring-2 ring-warning mb-6">
      <h3 class="text-xl font-semibold text-warning mb-2">Opening Break Foul</h3>
      <p class="text-sm/6 text-text-secondary mb-2">{{ foulingPlayerName }} committed a foul on the opening break.</p>

      <!-- Incoming player sees choice buttons -->
      <template v-if="isIncomingPlayer">
        <p class="font-medium text-text-primary mb-6">Choose your option:</p>
        <div class="flex flex-col gap-3">
          <button class="btn btn--primary w-full" @click="$emit('accept-table')">
            Accept Table
          </button>
          <button class="btn btn--secondary w-full" @click="$emit('force-rebreak')">
            Force Rebreak
          </button>
        </div>
      </template>

      <!-- Fouling player sees waiting message -->
      <template v-else>
        <div class="flex flex-col items-center gap-4 py-6">
          <div class="animate-bounce-dots flex gap-1">
            <span class="bg-warning" />
            <span class="bg-warning" />
            <span class="bg-warning" />
          </div>
          <p class="text-sm/6 text-text-secondary mb-0">Waiting for {{ incomingPlayerName }} to decide...</p>
        </div>
      </template>
    </div>

    <!-- Game completed banner -->
    <div v-if="gameStatus === 'completed'" class="text-center p-8 bg-bg-secondary rounded-2xl ring-1 ring-white/10 mb-6">
      <h2 class="text-2xl font-semibold mb-4">{{ $t('gameEnd.title') }}</h2>
      <p class="text-lg text-success mb-8">
        {{ $t('gameEnd.winner') }}: {{ winnerName }}
      </p>
      <div class="flex flex-col gap-3">
        <button class="btn btn--primary w-full" @click="$emit('rematch')">
          New Game (Same Players)
        </button>
        <button class="btn btn--secondary w-full" @click="$emit('new-opponent')">
          New Game (New Opponent)
        </button>
      </div>
    </div>

    <!-- Rerack required banner -->
    <div v-if="needsRerack && gameStatus === 'active'" class="text-center p-8 bg-bg-secondary rounded-2xl ring-2 ring-accent mb-6">
      <h3 class="text-xl font-semibold text-accent mb-2">Rack Complete!</h3>
      <p class="text-sm/6 text-text-secondary mb-6">14 balls have been pocketed. Press Rerack to continue.</p>
      <button class="btn btn--primary btn--large" @click="$emit('rerack')">
        {{ $t('game.rerack') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showFoulWarning: boolean
  consecutiveFouls: number
  awaitingFoulOption: boolean
  foulingPlayerName: string
  incomingPlayerName: string
  isIncomingPlayer: boolean
  gameStatus: string
  winnerName: string
  needsRerack: boolean
}

interface Emits {
  'accept-table': []
  'force-rebreak': []
  'rematch': []
  'new-opponent': []
  'rerack': []
}

defineProps<Props>()
defineEmits<Emits>()
</script>