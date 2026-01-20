<template>
  <section v-if="isCreator" class="flex flex-col gap-4">
    <h2 class="text-lg font-semibold pb-2 border-b border-white/10">Game Settings</h2>

    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-1">
        <label for="targetScore" class="text-sm/6 text-text-secondary">{{ $t('setup.targetScore') }}</label>
        <select 
          id="targetScore" 
          :value="targetScore"
          @change="$emit('update:target-score', parseInt(($event.target as HTMLSelectElement).value))"
        >
          <option :value="50">50</option>
          <option :value="75">75</option>
          <option :value="100">100</option>
          <option :value="125">125</option>
          <option :value="150">150</option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label for="firstBreak" class="text-sm/6 text-text-secondary">{{ $t('setup.firstBreak') }}</label>
        <select 
          id="firstBreak" 
          :value="firstBreak"
          @change="$emit('update:first-break', ($event.target as HTMLSelectElement).value)"
        >
          <option value="player1">{{ player1Name }}</option>
          <option value="player2">{{ player2Name }}</option>
        </select>
      </div>

      <!-- Handicap settings -->
      <HandicapSettings
        :show-handicap-section="showHandicapSection"
        :recommended-handicap="recommendedHandicap"
        :recommended-handicap-display="recommendedHandicapDisplay"
        :player1-name="player1Name"
        :player2-name="player2Name"
        :player1-handicap="player1Handicap"
        :player2-handicap="player2Handicap"
        @apply-recommended="$emit('apply-recommended-handicap')"
        @update:player1-handicap="$emit('update:player1-handicap', $event)"
        @update:player2-handicap="$emit('update:player2-handicap', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PlayerRole } from '~~/shared/types'
import HandicapSettings from './HandicapSettings.vue'

interface Props {
  isCreator: boolean
  targetScore: number
  firstBreak: PlayerRole
  player1Name: string
  player2Name: string
  showHandicapSection: boolean
  recommendedHandicap: { player1Handicap: number; player2Handicap: number } | null
  recommendedHandicapDisplay: string
  player1Handicap: number
  player2Handicap: number
}

interface Emits {
  'update:target-score': [value: number]
  'update:first-break': [value: string]
  'apply-recommended-handicap': []
  'update:player1-handicap': [value: number]
  'update:player2-handicap': [value: number]
}

defineProps<Props>()
defineEmits<Emits>()
</script>