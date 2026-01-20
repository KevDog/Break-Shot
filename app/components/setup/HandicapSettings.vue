<template>
  <div v-if="showHandicapSection" class="col-span-2 flex flex-col gap-1">
    <h3 class="text-base font-medium mb-2">{{ $t('setup.handicap') }}</h3>

    <div v-if="recommendedHandicap" class="flex items-center gap-2 p-3 px-4 bg-bg-elevated rounded-xl ring-1 ring-white/5 text-sm/6 mb-4">
      <span>{{ $t('setup.recommendedHandicap') }}:</span>
      <strong class="text-accent">{{ recommendedHandicapDisplay }}</strong>
      <button class="btn btn--sm btn--secondary" @click="$emit('apply-recommended')">
        Apply
      </button>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-1">
        <label for="player1Handicap" class="text-sm/6 text-text-secondary">{{ player1Name }} starts at</label>
        <input
          id="player1Handicap"
          :value="player1Handicap"
          type="number"
          min="-50"
          max="50"
          @input="$emit('update:player1-handicap', parseInt(($event.target as HTMLInputElement).value) || 0)"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label for="player2Handicap" class="text-sm/6 text-text-secondary">{{ player2Name }} starts at</label>
        <input
          id="player2Handicap"
          :value="player2Handicap"
          type="number"
          min="-50"
          max="50"
          @input="$emit('update:player2-handicap', parseInt(($event.target as HTMLInputElement).value) || 0)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showHandicapSection: boolean
  recommendedHandicap: { player1Handicap: number; player2Handicap: number } | null
  recommendedHandicapDisplay: string
  player1Name: string
  player2Name: string
  player1Handicap: number
  player2Handicap: number
}

interface Emits {
  'apply-recommended': []
  'update:player1-handicap': [value: number]
  'update:player2-handicap': [value: number]
}

defineProps<Props>()
defineEmits<Emits>()
</script>