<template>
  <main class="flex-1 flex flex-col p-4 sm:p-6">
    <div class="max-w-md mx-auto w-full">
      <h1 class="text-2xl font-bold mb-8">Local Game Setup</h1>

      <form @submit.prevent="startGame" class="flex flex-col gap-6">
        <!-- Player Names -->
        <div class="flex flex-col gap-4">
          <Field>
            <Label for="player1Name">Player 1 Name</Label>
            <Input
              id="player1Name"
              v-model="player1Name"
              required
              placeholder="Enter name"
            />
          </Field>

          <Field>
            <Label for="player2Name">Player 2 Name</Label>
            <Input
              id="player2Name"
              v-model="player2Name"
              required
              placeholder="Enter name"
            />
          </Field>
        </div>

        <!-- Target Score -->
        <Field>
          <Label for="targetScore">Target Score</Label>
          <Select v-model="targetScore" id="targetScore">
            <option :value="50">50 points</option>
            <option :value="100">100 points</option>
            <option :value="150">150 points (Standard)</option>
            <option :value="200">200 points</option>
          </Select>
        </Field>

        <!-- Handicap Options -->
        <Field>
          <Label>Handicap (Optional)</Label>
          <div class="flex flex-col gap-3">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="handicapPlayer"
                type="radio"
                value="none"
                class="h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span class="text-sm">No handicap</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="handicapPlayer"
                type="radio"
                value="player1"
                class="h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span class="text-sm">Give {{ player1Name || 'Player 1' }} a head start</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="handicapPlayer"
                type="radio"
                value="player2"
                class="h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span class="text-sm">Give {{ player2Name || 'Player 2' }} a head start</span>
            </label>
          </div>
          
          <!-- Handicap Amount Input -->
          <Transition name="slide">
            <div v-if="handicapPlayer !== 'none'" class="mt-3">
              <Label for="handicapAmount">Head start points</Label>
              <Input
                id="handicapAmount"
                v-model.number="handicapAmount"
                type="number"
                min="1"
                :max="targetScore - 1"
                placeholder="Enter points"
                required
              />
              <Description class="mt-1">
                {{ handicapPlayer === 'player1' ? (player1Name || 'Player 1') : (player2Name || 'Player 2') }} will start with {{ handicapAmount || 0 }} points
              </Description>
            </div>
          </Transition>
        </Field>


        <!-- Game Options -->
        <div class="flex flex-col gap-3">
          <Field>
            <Label for="firstBreak">Who Breaks First?</Label>
            <Select v-model="firstBreak" id="firstBreak">
              <option value="player1">{{ player1Name || 'Player 1' }}</option>
              <option value="player2">{{ player2Name || 'Player 2' }}</option>
              <option value="random">Random</option>
            </Select>
          </Field>

          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="allowNegativeScore"
              type="checkbox"
              class="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
            />
            <span class="text-sm">Allow negative scores</span>
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <NuxtLink to="/" class="btn btn--secondary flex-1">
            Cancel
          </NuxtLink>
          <Button type="submit" variant="primary" class="flex-1">
            Start Game
          </Button>
        </div>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import Field from '~/components/ui/Field.vue'
import Label from '~/components/ui/Label.vue'
import Input from '~/components/ui/Input.vue'
import Select from '~/components/ui/Select.vue'
import Description from '~/components/ui/Description.vue'
import Button from '~/components/ui/Button.vue'

const { createGame } = useLocalGame()

// Form state
const player1Name = ref('')
const player2Name = ref('')
const targetScore = ref(150)
const firstBreak = ref<'player1' | 'player2' | 'random'>('player1')
const allowNegativeScore = ref(false)
const handicapPlayer = ref<'none' | 'player1' | 'player2'>('none')
const handicapAmount = ref(0)

function startGame() {
  // Determine actual first break if random
  let actualFirstBreak = firstBreak.value
  if (firstBreak.value === 'random') {
    actualFirstBreak = Math.random() < 0.5 ? 'player1' : 'player2'
  }

  // Create the game
  createGame({
    player1Name: player1Name.value,
    player2Name: player2Name.value,
    targetScore: targetScore.value,
    player1Handicap: handicapPlayer.value === 'player1' ? handicapAmount.value : 0,
    player2Handicap: handicapPlayer.value === 'player2' ? handicapAmount.value : 0,
    allowNegativeScore: allowNegativeScore.value,
    firstBreak: actualFirstBreak as 'player1' | 'player2',
  })

  // Navigate to game page
  navigateTo('/local/game')
}

// Page meta
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Break Shot - Local Game Setup',
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>