<template>
  <main class="flex-1 flex flex-col p-4 sm:p-6">
    <div class="max-w-md mx-auto w-full">
      <h1 class="text-2xl font-bold mb-8">{{ $t('practice.title') }} Setup</h1>

      <form @submit.prevent="startPractice" class="flex flex-col gap-6">
        <!-- Player Name -->
        <Field>
          <Label for="playerName">Your Name</Label>
          <Input
            id="playerName"
            v-model="playerName"
            required
            placeholder="Enter your name"
          />
        </Field>

        <!-- Practice Mode Selection -->
        <Field>
          <Label>Practice Mode</Label>
          <div class="flex flex-col gap-3">
            <label class="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all"
              :class="practiceMode === 'quick' ? 'border-primary bg-primary/10' : 'border-border'">
              <input
                v-model="practiceMode"
                type="radio"
                value="quick"
                class="h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <div>
                <span class="text-sm font-medium">{{ $t('practice.quickStart') }}</span>
                <p class="text-xs text-text-secondary">150 points target</p>
              </div>
            </label>
            
            <label class="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all"
              :class="practiceMode === 'custom' ? 'border-primary bg-primary/10' : 'border-border'">
              <input
                v-model="practiceMode"
                type="radio"
                value="custom"
                class="h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <div>
                <span class="text-sm font-medium">{{ $t('practice.customTarget') }}</span>
                <p class="text-xs text-text-secondary">Set your own target</p>
              </div>
            </label>
            
            <label class="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all"
              :class="practiceMode === 'endless' ? 'border-primary bg-primary/10' : 'border-border'">
              <input
                v-model="practiceMode"
                type="radio"
                value="endless"
                class="h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <div>
                <span class="text-sm font-medium">{{ $t('practice.endlessMode') }}</span>
                <p class="text-xs text-text-secondary">No target, just practice</p>
              </div>
            </label>
          </div>
        </Field>

        <!-- Custom Target Score (only shown for custom mode) -->
        <Transition name="slide">
          <Field v-if="practiceMode === 'custom'">
            <Label for="targetScore">{{ $t('practice.targetScore') }}</Label>
            <Input
              id="targetScore"
              v-model.number="customTarget"
              type="number"
              min="10"
              max="500"
              placeholder="Enter target score"
              required
            />
          </Field>
        </Transition>

        <!-- Personal Best Display -->
        <div v-if="personalBest.score > 0" class="p-4 bg-bg-secondary rounded-lg">
          <h3 class="text-sm font-medium text-text-secondary mb-2">{{ $t('practice.personalBest') }}</h3>
          <div class="flex justify-between text-sm">
            <span>Best Score:</span>
            <span class="font-bold">{{ personalBest.score }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Best Run:</span>
            <span class="font-bold">{{ personalBest.highRun }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <NuxtLink to="/" class="btn btn--secondary flex-1">
            Cancel
          </NuxtLink>
          <Button type="submit" variant="primary" class="flex-1">
            Start Practice
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
import Button from '~/components/ui/Button.vue'

const { createPracticeSession, getPersonalBest } = usePracticeGame()

// Form state
const playerName = ref('')
const practiceMode = ref<'quick' | 'custom' | 'endless'>('quick')
const customTarget = ref(100)

// Get personal best
const personalBest = getPersonalBest()

function startPractice() {
  let targetScore: number | null = null
  
  switch (practiceMode.value) {
    case 'quick':
      targetScore = 150
      break
    case 'custom':
      targetScore = customTarget.value
      break
    case 'endless':
      targetScore = null
      break
  }

  // Create the practice session
  createPracticeSession({
    playerName: playerName.value,
    targetScore,
  })

  // Navigate to game page
  navigateTo('/practice/game')
}

// Page meta
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Break Shot - Practice Mode Setup',
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