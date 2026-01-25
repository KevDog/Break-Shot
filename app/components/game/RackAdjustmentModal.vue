<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[100]" @click.self="close">
        <div class="bg-bg-secondary rounded-2xl p-6 sm:p-8 max-w-md w-full ring-1 ring-white/10">
          <h3 class="text-xl font-semibold mb-6">Adjust Rack Scores</h3>
          
          <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
            <!-- Player 1 Rack Score -->
            <Field>
              <Label :for="`player1-rack-${uid}`">
                {{ player1Name || 'Player 1' }} Rack Score
              </Label>
              <Input
                :id="`player1-rack-${uid}`"
                v-model.number="player1Rack"
                type="number"
                min="0"
                max="14"
                required
              />
              <Description>Current: {{ currentPlayer1RackScore }}</Description>
            </Field>

            <!-- Player 2 Rack Score (only for multiplayer) -->
            <Field v-if="player2Name">
              <Label :for="`player2-rack-${uid}`">
                {{ player2Name || 'Player 2' }} Rack Score
              </Label>
              <Input
                :id="`player2-rack-${uid}`"
                v-model.number="player2Rack"
                type="number"
                min="0"
                max="14"
                required
              />
              <Description>Current: {{ currentPlayer2RackScore }}</Description>
            </Field>

            <!-- Balls Remaining on Table -->
            <Field>
              <Label :for="`balls-remaining-${uid}`">
                Balls Remaining on Table
              </Label>
              <Input
                :id="`balls-remaining-${uid}`"
                v-model.number="ballsRemaining"
                type="number"
                min="0"
                max="14"
                required
              />
              <Description>
                {{ 14 - ballsRemaining }} balls pocketed this rack
              </Description>
            </Field>

            <!-- Validation Warning -->
            <div v-if="validationError" class="text-sm text-error">
              {{ validationError }}
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4">
              <button type="button" class="btn btn--secondary flex-1" @click="close">
                Cancel
              </button>
              <button type="submit" class="btn btn--primary flex-1" :disabled="!!validationError">
                Apply Adjustment
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Field from '~/components/ui/Field.vue'
import Label from '~/components/ui/Label.vue'
import Input from '~/components/ui/Input.vue'
import Description from '~/components/ui/Description.vue'

interface Props {
  modelValue: boolean
  player1Name?: string
  player2Name?: string | null
  currentPlayer1RackScore: number
  currentPlayer2RackScore: number
  currentBallsRemaining: number
}

interface Emits {
  'update:modelValue': [value: boolean]
  'adjust': [adjustment: { player1RackScore: number; player2RackScore: number; ballsRemaining: number }]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Generate unique ID for form fields
const uid = Math.random().toString(36).substring(7)

// Form state
const player1Rack = ref(props.currentPlayer1RackScore)
const player2Rack = ref(props.currentPlayer2RackScore)
const ballsRemaining = ref(props.currentBallsRemaining)

// Watch for prop changes to update form
watch(() => props.currentPlayer1RackScore, (val) => {
  player1Rack.value = val
})

watch(() => props.currentPlayer2RackScore, (val) => {
  player2Rack.value = val
})

watch(() => props.currentBallsRemaining, (val) => {
  ballsRemaining.value = val
})

// Validation
const validationError = computed(() => {
  const totalPocketed = player1Rack.value + (props.player2Name ? player2Rack.value : 0)
  const expectedPocketed = 14 - ballsRemaining.value
  
  if (totalPocketed !== expectedPocketed) {
    return `Rack scores (${totalPocketed}) must equal balls pocketed (${expectedPocketed})`
  }
  
  return ''
})

function handleSubmit() {
  if (validationError.value) return
  
  emit('adjust', {
    player1RackScore: player1Rack.value,
    player2RackScore: props.player2Name ? player2Rack.value : 0,
    ballsRemaining: ballsRemaining.value,
  })
  
  close()
}

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>