<template>
  <main class="flex-1 flex flex-col p-4 sm:p-6">
    <!-- No game state -->
    <div v-if="!game" class="flex-1 flex flex-col items-center justify-center gap-4">
      <p class="text-sm/6 text-text-secondary">No active game</p>
      <NuxtLink to="/local/setup" class="btn btn--primary">
        Start New Game
      </NuxtLink>
    </div>

    <!-- Game view -->
    <div v-else class="flex-1 flex flex-col gap-6 max-w-[600px] mx-auto w-full">
      <!-- Scoreboard -->
      <section class="grid grid-cols-[1fr_auto_1fr] gap-4 bg-bg-secondary rounded-2xl p-6 ring-1 ring-white/10 max-sm:grid-cols-2 max-sm:grid-rows-[auto_auto]">
        <!-- Player 1 -->
        <PlayerCard
          :player="player1"
          :player-state="player1State"
          :is-current-turn="gameState?.currentTurn === 'player1'"
          :is-winner="gameState?.winnerId === player1?.id"
          player-label="Player 1"
        />

        <!-- Game info -->
        <GameInfo
          :target-score="game.targetScore"
          :current-inning="gameState?.currentInning || 1"
          :rerack-count="gameState?.rerackCount || 0"
        />

        <!-- Player 2 -->
        <PlayerCard
          :player="player2"
          :player-state="player2State"
          :is-current-turn="gameState?.currentTurn === 'player2'"
          :is-winner="gameState?.winnerId === player2?.id"
          player-label="Player 2"
        />
      </section>

      <!-- Current Player Indicator (Local Game) -->
      <div class="bg-accent/10 border-2 border-accent rounded-xl p-3 text-center animate-pulse">
        <p class="text-lg font-bold text-accent">{{ currentTurnPlayerName }}'s Turn</p>
      </div>

      <!-- Balls Remaining -->
      <BallsRemaining
        :remaining-balls="remainingBallsInRack"
        :needs-rerack="needsRerack"
      />

      <!-- Game banners -->
      <GameBanners
        :show-foul-warning="showFoulWarning"
        :consecutive-fouls="consecutiveFouls"
        :awaiting-foul-option="awaitingFoulOption"
        :fouling-player-name="foulingPlayerName"
        :incoming-player-name="incomingPlayerName"
        :is-incoming-player="true"
        :game-status="gameState?.status || 'active'"
        :winner-name="winnerName"
        :needs-rerack="needsRerack"
        @accept-table="handleAcceptTable"
        @force-rebreak="handleForceRebreak"
        @rematch="handleRematch"
        @new-opponent="handleNewGame"
        @rerack="handleRerack"
      />

      <!-- Scoring controls -->
      <GameControls
        :game-status="gameState?.status || 'active'"
        :needs-rerack="needsRerack"
        :awaiting-foul-option="awaitingFoulOption"
        :is-my-turn="true"
        :current-turn-player-name="currentTurnPlayerName"
        :ball-count="ballCount"
        :remaining-balls-in-rack="remainingBallsInRack"
        :balls-in-current-rack="ballsInCurrentRack"
        :can-undo="canUndoPlayer1 || canUndoPlayer2"
        @increment-balls="incrementBalls"
        @decrement-balls="decrementBalls"
        @score-balls="handleScoreBalls"
        @miss="handleMiss"
        @scratch="handleScratch"
        @foul="handleFoul"
        @safety="handleSafety"
        @rerack="handleRerack"
        @undo="handleUndo"
        @show-end-game="showEndGameConfirm = true"
      />

      <!-- Rack Adjustment Button -->
      <div class="flex justify-center">
        <button class="btn btn--ghost text-sm" @click="showRackAdjustment = true">
          Adjust Rack Scores
        </button>
      </div>

      <!-- End game confirmation modal -->
      <div v-if="showEndGameConfirm" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[100]" @click.self="showEndGameConfirm = false">
        <div class="bg-bg-secondary rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center ring-1 ring-white/10">
          <h3 class="text-xl font-semibold mb-8">{{ $t('gameEnd.confirmEnd') }}</h3>
          <div class="flex gap-4">
            <button class="btn btn--secondary flex-1" @click="showEndGameConfirm = false">
              {{ $t('common.cancel') }}
            </button>
            <button class="btn btn--danger flex-1" @click="handleConfirmEndGame">
              {{ $t('game.endGame') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Rack Adjustment Modal -->
      <RackAdjustmentModal
        v-model="showRackAdjustment"
        :player1-name="player1?.name"
        :player2-name="player2?.name"
        :current-player1-rack-score="player1State?.rackScore || 0"
        :current-player2-rack-score="player2State?.rackScore || 0"
        :current-balls-remaining="14 - (gameState?.ballsInCurrentRack || 0)"
        @adjust="handleRackAdjustment"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
import PlayerCard from '~/components/game/PlayerCard.vue'
import GameInfo from '~/components/game/GameInfo.vue'
import BallsRemaining from '~/components/game/BallsRemaining.vue'
import GameBanners from '~/components/game/GameBanners.vue'
import GameControls from '~/components/game/GameControls.vue'
import RackAdjustmentModal from '~/components/game/RackAdjustmentModal.vue'

const { t } = useI18n()

const {
  game,
  player1,
  player2,
  gameState,
  player1State,
  player2State,
  player1DisplayScore,
  player2DisplayScore,
  recordBallsMade,
  recordRackAdjustment,
  recordFoul,
  recordFoulOption,
  recordSafety,
  recordEndTurn,
  recordRerack,
  undoLastAction,
  checkCanUndo,
  endGame,
  clearGame,
  rematch,
} = useLocalGame()

const ballCount = ref(0)
const showEndGameConfirm = ref(false)
const showRackAdjustment = ref(false)

// Computed
const isPlayer1Turn = computed(() => gameState.value?.currentTurn === 'player1')

const currentPlayerId = computed(() => {
  return isPlayer1Turn.value ? player1.value?.id : player2.value?.id
})

const currentTurnPlayerName = computed(() => {
  return isPlayer1Turn.value ? player1.value?.name : player2.value?.name
})


const consecutiveFouls = computed(() => {
  if (isPlayer1Turn.value) {
    return player1State.value?.consecutiveFouls || 0
  }
  return player2State.value?.consecutiveFouls || 0
})

const showFoulWarning = computed(() => consecutiveFouls.value >= 2)

const canUndoPlayer1 = computed(() => player1.value ? checkCanUndo(player1.value.id) : false)
const canUndoPlayer2 = computed(() => player2.value ? checkCanUndo(player2.value.id) : false)

const winnerName = computed(() => {
  if (!gameState.value?.winnerId) return ''
  if (gameState.value.winnerId === player1.value?.id) return player1.value?.name
  if (gameState.value.winnerId === player2.value?.id) return player2.value?.name
  return ''
})

// Rack tracking
const ballsInCurrentRack = computed(() => gameState.value?.ballsInCurrentRack || 0)
const needsRerack = computed(() => gameState.value?.needsRerack || false)
const remainingBallsInRack = computed(() => 14 - ballsInCurrentRack.value)

// Foul option
const awaitingFoulOption = computed(() => gameState.value?.awaitingFoulOption || false)
const foulingPlayerName = computed(() => {
  if (!gameState.value?.foulingPlayer) return ''
  return gameState.value.foulingPlayer === 'player1' ? player1.value?.name : player2.value?.name
})
const incomingPlayerName = computed(() => {
  if (!gameState.value?.foulingPlayer) return ''
  return gameState.value.foulingPlayer === 'player1' ? player2.value?.name : player1.value?.name
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
  if (!currentPlayerId.value || ballCount.value === 0) return
  await recordBallsMade(currentPlayerId.value, ballCount.value)
  ballCount.value = 0
}

async function handleScratch() {
  if (!currentPlayerId.value) return
  // Scratch is a foul but typically on the break or when pocketing the cue ball
  if (ballCount.value > 0) {
    await recordBallsMade(currentPlayerId.value, ballCount.value)
  }
  await recordFoul(currentPlayerId.value)
  ballCount.value = 0
}

async function handleFoul() {
  if (!currentPlayerId.value) return
  if (ballCount.value > 0) {
    await recordBallsMade(currentPlayerId.value, ballCount.value)
  }
  await recordFoul(currentPlayerId.value)
  ballCount.value = 0
}

async function handleSafety() {
  if (!currentPlayerId.value) return
  if (ballCount.value > 0) {
    await recordBallsMade(currentPlayerId.value, ballCount.value)
  }
  await recordSafety(currentPlayerId.value)
  ballCount.value = 0
}

async function handleMiss() {
  if (!currentPlayerId.value) return
  if (ballCount.value > 0) {
    await recordBallsMade(currentPlayerId.value, ballCount.value)
  }
  await recordEndTurn(currentPlayerId.value)
  ballCount.value = 0
}

async function handleRerack() {
  if (!currentPlayerId.value) return
  
  // Record any balls made before reracking
  if (ballCount.value > 0) {
    await recordBallsMade(currentPlayerId.value, ballCount.value)
  }
  
  await recordRerack(currentPlayerId.value)
  ballCount.value = 0
}

async function handleAcceptTable() {
  const incomingPlayerId = gameState.value?.foulingPlayer === 'player1' ? player2.value?.id : player1.value?.id
  if (!incomingPlayerId) return
  await recordFoulOption(incomingPlayerId, 'accept_table')
}

async function handleForceRebreak() {
  const incomingPlayerId = gameState.value?.foulingPlayer === 'player1' ? player2.value?.id : player1.value?.id
  if (!incomingPlayerId) return
  await recordFoulOption(incomingPlayerId, 'force_rebreak')
}

async function handleUndo() {
  if (canUndoPlayer1.value && player1.value) {
    await undoLastAction(player1.value.id)
  } else if (canUndoPlayer2.value && player2.value) {
    await undoLastAction(player2.value.id)
  }
}

async function handleConfirmEndGame() {
  showEndGameConfirm.value = false
  const playerId = currentPlayerId.value || player1.value?.id
  if (!playerId) return
  await endGame(playerId, 'abandoned')
}

async function handleRackAdjustment(adjustment: { player1RackScore: number; player2RackScore: number; ballsRemaining: number }) {
  await recordRackAdjustment(adjustment)
  ballCount.value = 0 // Reset ball count after adjustment
}

function handleRematch() {
  rematch()
}

function handleNewGame() {
  clearGame()
  navigateTo('/local/setup')
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
  title: t('app.name') + ' - Local Game',
})
</script>