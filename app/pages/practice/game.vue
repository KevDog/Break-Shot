<template>
  <main class="flex-1 flex flex-col p-4 sm:p-6">
    <!-- No game state -->
    <div v-if="!game" class="flex-1 flex flex-col items-center justify-center gap-4">
      <p class="text-sm/6 text-text-secondary">No active practice session</p>
      <NuxtLink to="/practice/setup" class="btn btn--primary">
        Start Practice
      </NuxtLink>
    </div>

    <!-- Game view -->
    <div v-else class="flex-1 flex flex-col gap-6 max-w-[600px] mx-auto w-full">
      <!-- Player Score Card -->
      <section class="bg-bg-secondary rounded-2xl p-6 ring-1 ring-white/10">
        <div class="flex flex-col items-center gap-4">
          <h2 class="text-lg font-semibold">{{ player?.name }}</h2>
          
          <!-- Main Score Display -->
          <div class="flex items-baseline gap-3">
            <div class="flex flex-col items-center">
              <span class="text-5xl font-bold leading-none">{{ playerState?.totalScore || 0 }}</span>
              <span class="text-xs text-text-muted">Total</span>
            </div>
            <span class="text-3xl text-text-muted">+</span>
            <div class="flex flex-col items-center">
              <span class="text-5xl font-bold leading-none text-accent">{{ playerState?.rackScore || 0 }}</span>
              <span class="text-xs text-text-muted">Rack</span>
            </div>
          </div>

          <!-- Progress Bar (if target mode) -->
          <div v-if="game.targetScore < 999999" class="w-full">
            <div class="flex justify-between text-sm text-text-secondary mb-1">
              <span>Progress</span>
              <span>{{ displayScore }} / {{ game.targetScore }}</span>
            </div>
            <div class="w-full bg-bg-primary rounded-full h-2">
              <div
                class="bg-primary h-2 rounded-full transition-all duration-300"
                :style="{ width: `${progressPercentage}%` }"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Session Statistics -->
      <section class="grid grid-cols-2 gap-3">
        <div class="bg-bg-secondary rounded-lg p-3 text-center">
          <p class="text-xs text-text-secondary">{{ $t('practice.currentRun') }}</p>
          <p class="text-2xl font-bold">{{ playerState?.currentRun || 0 }}</p>
        </div>
        <div class="bg-bg-secondary rounded-lg p-3 text-center">
          <p class="text-xs text-text-secondary">{{ $t('practice.sessionHighRun') }}</p>
          <p class="text-2xl font-bold">{{ sessionHighRun }}</p>
        </div>
        <div class="bg-bg-secondary rounded-lg p-3 text-center">
          <p class="text-xs text-text-secondary">{{ $t('practice.totalInnings') }}</p>
          <p class="text-2xl font-bold">{{ totalInnings }}</p>
        </div>
        <div class="bg-bg-secondary rounded-lg p-3 text-center">
          <p class="text-xs text-text-secondary">{{ $t('practice.averageRun') }}</p>
          <p class="text-2xl font-bold">{{ averageBallsPerInning }}</p>
        </div>
      </section>

      <!-- Time Elapsed -->
      <div class="bg-bg-secondary rounded-lg p-3 text-center">
        <p class="text-xs text-text-secondary">{{ $t('practice.timeElapsed') }}</p>
        <p class="text-xl font-bold">{{ formatTime(timeElapsed) }}</p>
      </div>

      <!-- Balls Remaining -->
      <BallsRemaining
        :remaining-balls="remainingBallsInRack"
        :needs-rerack="needsRerack"
      />

      <!-- Foul Warning -->
      <div v-if="consecutiveFouls >= 2" class="bg-warning/10 border-2 border-warning rounded-xl p-4 text-center">
        <p class="text-warning font-semibold">
          Warning: {{ consecutiveFouls }} consecutive fouls
        </p>
        <p class="text-sm text-warning/80">Next foul = 15 point penalty</p>
      </div>

      <!-- Rerack Banner -->
      <div v-if="needsRerack" class="bg-primary/10 border-2 border-primary rounded-xl p-4 text-center">
        <p class="text-primary font-semibold">Rerack Required</p>
        <button class="btn btn--primary mt-2" @click="handleRerack">
          {{ $t('game.rerack') }}
        </button>
      </div>

      <!-- Scoring controls -->
      <section class="flex flex-col gap-6">
        <!-- Ball count input -->
        <ScoreInput 
          :ball-count="ballCount" 
          :max-balls="remainingBallsInRack"
          @increment="incrementBalls"
          @decrement="decrementBalls"
        />

        <!-- Action buttons -->
        <div class="flex flex-col gap-4">
          <button
            class="btn btn--primary btn--large w-full min-h-[56px]"
            :disabled="ballCount === 0 || ballCount > remainingBallsInRack"
            @click="handleScoreBalls"
          >
            {{ $t('game.ballsMade') }} ({{ ballCount }})
          </button>

          <!-- End of Turn box -->
          <div class="p-4 bg-bg-secondary rounded-xl ring-1 ring-white/10">
            <h3 class="text-sm font-medium text-text-secondary mb-3 text-center">End Inning</h3>
            <div class="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <button
                class="btn btn--secondary w-full min-h-[56px]"
                @click="handleMiss"
              >
                Miss
              </button>
              <button
                class="btn btn--secondary w-full min-h-[56px]"
                @click="handleScratch"
              >
                {{ $t('game.scratch') }}
              </button>
              <button
                class="btn btn--secondary w-full min-h-[56px]"
                @click="handleFoul"
              >
                {{ $t('game.foul') }}
              </button>
              <button
                class="btn btn--secondary w-full min-h-[56px]"
                @click="handleSafety"
              >
                {{ $t('game.safety') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Secondary actions -->
        <div class="flex justify-center gap-6 pt-4 border-t border-white/10">
          <button
            class="btn btn--ghost"
            :disabled="!canUndo"
            @click="handleUndo"
          >
            {{ $t('game.undo') }}
          </button>
          <button class="btn btn--ghost text-error hover:bg-error/10" @click="showEndConfirm = true">
            End Session
          </button>
        </div>
      </section>

      <!-- End session confirmation modal -->
      <div v-if="showEndConfirm" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[100]" @click.self="showEndConfirm = false">
        <div class="bg-bg-secondary rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center ring-1 ring-white/10">
          <h3 class="text-xl font-semibold mb-8">End Practice Session?</h3>
          <div class="flex gap-4">
            <button class="btn btn--secondary flex-1" @click="showEndConfirm = false">
              {{ $t('common.cancel') }}
            </button>
            <button class="btn btn--danger flex-1" @click="handleEndSession">
              End Session
            </button>
          </div>
        </div>
      </div>

      <!-- Session Complete Modal -->
      <div v-if="sessionComplete" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[100]">
        <div class="bg-bg-secondary rounded-2xl p-6 sm:p-8 max-w-md w-full ring-1 ring-white/10">
          <h3 class="text-2xl font-bold mb-6 text-center">{{ $t('practice.sessionComplete') }}</h3>
          
          <div class="flex flex-col gap-4 mb-6">
            <div class="flex justify-between">
              <span class="text-text-secondary">Final Score:</span>
              <span class="font-bold text-xl">{{ displayScore }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">Session High Run:</span>
              <span class="font-bold text-xl">{{ sessionHighRun }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">Total Innings:</span>
              <span class="font-bold text-xl">{{ totalInnings }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">Time:</span>
              <span class="font-bold text-xl">{{ formatTime(timeElapsed) }}</span>
            </div>
          </div>

          <div v-if="isNewPersonalBest" class="bg-success/10 rounded-lg p-4 mb-6 text-center">
            <p class="text-success font-bold">{{ $t('practice.newPersonalBest') }}</p>
          </div>

          <div class="flex gap-4">
            <button class="btn btn--secondary flex-1" @click="handleBackToMenu">
              {{ $t('practice.backToMenu') }}
            </button>
            <button class="btn btn--primary flex-1" @click="handlePlayAgain">
              {{ $t('practice.playAgain') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import BallsRemaining from '~/components/game/BallsRemaining.vue'
import ScoreInput from '~/components/game/ScoreInput.vue'

const { t } = useI18n()

const {
  game,
  player,
  gameState,
  playerState,
  displayScore,
  timeElapsed,
  averageBallsPerInning,
  progressPercentage,
  sessionHighRun,
  totalInnings,
  recordBallsMade,
  recordFoul,
  recordSafety,
  recordEndTurn,
  recordRerack,
  undoLastAction,
  endSession,
  checkCanUndo,
  clearSession,
  getPersonalBest,
} = usePracticeGame()

const ballCount = ref(0)
const showEndConfirm = ref(false)
const sessionComplete = ref(false)
const isNewPersonalBest = ref(false)

// Computed
const consecutiveFouls = computed(() => playerState.value?.consecutiveFouls || 0)
const canUndo = computed(() => checkCanUndo())

// Rack tracking
const ballsInCurrentRack = computed(() => gameState.value?.ballsInCurrentRack || 0)
const needsRerack = computed(() => gameState.value?.needsRerack || false)
const remainingBallsInRack = computed(() => 14 - ballsInCurrentRack.value)

// Watch for target reached
watch(displayScore, (newScore) => {
  if (game.value && game.value.targetScore < 999999 && newScore >= game.value.targetScore) {
    handleTargetReached()
  }
})

// Methods
function incrementBalls() {
  if (ballCount.value < remainingBallsInRack.value) {
    ballCount.value++
  }
}

function decrementBalls() {
  if (ballCount.value > 0) {
    ballCount.value--
  }
}

async function handleScoreBalls() {
  if (ballCount.value === 0) return
  await recordBallsMade(ballCount.value)
  ballCount.value = 0
}

async function handleScratch() {
  if (ballCount.value > 0) {
    await recordBallsMade(ballCount.value)
  }
  await recordFoul()
  ballCount.value = 0
}

async function handleFoul() {
  if (ballCount.value > 0) {
    await recordBallsMade(ballCount.value)
  }
  await recordFoul()
  ballCount.value = 0
}

async function handleSafety() {
  if (ballCount.value > 0) {
    await recordBallsMade(ballCount.value)
  }
  await recordSafety()
  ballCount.value = 0
}

async function handleMiss() {
  if (ballCount.value > 0) {
    await recordBallsMade(ballCount.value)
  }
  await recordEndTurn()
  ballCount.value = 0
}

async function handleRerack() {
  // Record any balls made before reracking
  if (ballCount.value > 0) {
    await recordBallsMade(ballCount.value)
  }
  
  await recordRerack()
  ballCount.value = 0
}

async function handleUndo() {
  await undoLastAction()
}

async function handleEndSession() {
  showEndConfirm.value = false
  await endSession()
  
  // Check for personal best
  const personalBest = getPersonalBest()
  if (displayScore.value >= personalBest.score || sessionHighRun.value >= personalBest.highRun) {
    isNewPersonalBest.value = true
  }
  
  sessionComplete.value = true
}

async function handleTargetReached() {
  await endSession()
  
  // Check for personal best
  const personalBest = getPersonalBest()
  if (displayScore.value >= personalBest.score || sessionHighRun.value >= personalBest.highRun) {
    isNewPersonalBest.value = true
  }
  
  sessionComplete.value = true
}

function handlePlayAgain() {
  clearSession()
  navigateTo('/practice/setup')
}

function handleBackToMenu() {
  clearSession()
  navigateTo('/')
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Watch for remaining balls changing
watch(remainingBallsInRack, (newRemaining) => {
  if (ballCount.value > newRemaining && newRemaining > 0) {
    ballCount.value = newRemaining
  } else if (newRemaining === 0) {
    ballCount.value = 0
  }
})

// Page meta
definePageMeta({
  layout: 'default',
})

useHead({
  title: t('app.name') + ' - Practice Mode',
})
</script>