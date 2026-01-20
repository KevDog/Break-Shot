<template>
  <div
    class="flex flex-col gap-3 p-4 bg-bg-elevated rounded-xl ring-1 ring-white/5"
    :class="{ 'ring-2 ring-accent': isCurrentPlayer }"
  >
    <span class="text-xs font-semibold text-accent uppercase tracking-wide">{{ playerLabel }}</span>
    <div class="flex flex-col gap-1">
      <label :for="isCurrentPlayer ? 'playerName' : undefined" class="text-sm/6 text-text-secondary">{{ $t('setup.playerName') }}</label>
      <input
        v-if="isCurrentPlayer"
        id="playerName"
        :value="playerName"
        type="text"
        :placeholder="$t('setup.playerName')"
        @blur="$emit('update-player')"
        @input="$emit('update:player-name', ($event.target as HTMLInputElement).value)"
      />
      <div v-else class="px-3 py-2 bg-bg-secondary rounded-lg text-sm/6 text-text-secondary min-h-[42px] flex items-center">
        {{ playerData?.name || $t('session.waiting') }}
      </div>
    </div>
    <div class="flex flex-col gap-1">
      <label :for="isCurrentPlayer ? 'fargoRating' : undefined" class="text-sm/6 text-text-secondary">{{ $t('setup.fargoRating') }}</label>
      <input
        v-if="isCurrentPlayer"
        id="fargoRating"
        :value="fargoRating"
        type="number"
        min="100"
        max="900"
        :placeholder="$t('setup.fargoRating')"
        @blur="$emit('update-player')"
        @input="$emit('update:fargo-rating', parseInt(($event.target as HTMLInputElement).value) || undefined)"
      />
      <div v-else class="px-3 py-2 bg-bg-secondary rounded-lg text-sm/6 text-text-secondary min-h-[42px] flex items-center">
        {{ playerData?.fargoRating || '-' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~~/shared/types'

interface Props {
  playerLabel: string
  playerName: string
  fargoRating?: number
  playerData?: Player | null
  isCurrentPlayer: boolean
}

interface Emits {
  'update:player-name': [value: string]
  'update:fargo-rating': [value: number | undefined]
  'update-player': []
}

defineProps<Props>()
defineEmits<Emits>()
</script>