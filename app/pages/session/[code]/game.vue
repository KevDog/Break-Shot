<template>
  <main class="flex-1 flex flex-col p-4 sm:p-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center gap-4">
      <div class="spinner" />
      <p class="text-sm/6 text-text-secondary">{{ $t('common.loading') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center gap-4">
      <p class="text-sm/6 text-text-secondary">{{ error }}</p>
      <NuxtLink to="/" class="btn btn--primary">
        {{ $t('common.back') }}
      </NuxtLink>
    </div>

    <!-- Game view -->
    <div v-else-if="game" class="flex-1 flex flex-col gap-6 max-w-[600px] mx-auto w-full">
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

      <!-- Balls Remaining - Prominent display -->
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
        :is-incoming-player="isIncomingPlayer"
        :game-status="gameState?.status || 'active'"
        :winner-name="winnerName"
        :needs-rerack="needsRerack"
        @accept-table="handleAcceptTable"
        @force-rebreak="handleForceRebreak"
        @rematch="handleRematch"
        @new-opponent="handleNewOpponent"
        @rerack="handleRerack"
      />

      <!-- Scoring controls -->
      <GameControls
        :game-status="gameState?.status || 'active'"
        :needs-rerack="needsRerack"
        :awaiting-foul-option="awaitingFoulOption"
        :is-my-turn="isMyTurn"
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
    </div>
  </main>
</template>

<script setup lang="ts">
import PlayerCard from '~/components/game/PlayerCard.vue'
import GameInfo from '~/components/game/GameInfo.vue'
import BallsRemaining from '~/components/game/BallsRemaining.vue'
import GameBanners from '~/components/game/GameBanners.vue'
import GameControls from '~/components/game/GameControls.vue'

const route = useRoute()
const { t } = useI18n()
const supabase = useSupabaseClient()

// Get current player from session to determine who the logged-in user is
const { currentPlayer } = useSession()

const {
  game,
  player1,
  player2,
  loading,
  error,
  gameState,
  player1State,
  player2State,
  player1DisplayScore,
  player2DisplayScore,
  loadGame,
  loadGameByCode,
  recordBallsMade,
  recordFoul,
  recordFoulOption,
  recordSafety,
  recordEndTurn,
  recordRerack,
  undoLastAction,
  checkCanUndo,
  subscribeToGame,
  endGame,
} = useGame()

const ballCount = ref(0)
const showEndGameConfirm = ref(false)
let unsubscribe: (() => void) | null = null

// Computed
const isPlayer1Turn = computed(() => gameState.value?.currentTurn === 'player1')

const currentPlayerId = computed(() => {
  return isPlayer1Turn.value ? player1.value?.id : player2.value?.id
})

// Check if it's the current logged-in user's turn
const isMyTurn = computed(() => {
  if (!currentPlayer.value || !currentPlayerId.value) return false
  return currentPlayer.value.id === currentPlayerId.value
})

// Get the name of the player whose turn it is
const currentTurnPlayerName = computed(() => {
  return isPlayer1Turn.value ? player1.value?.name : player2.value?.name
})

// Get consecutive fouls for the player whose turn it currently is
const consecutiveFouls = computed(() => {
  if (isPlayer1Turn.value) {
    return player1State.value?.consecutiveFouls || 0
  }
  return player2State.value?.consecutiveFouls || 0
})

// Only show foul warning at 2 consecutive fouls (3rd foul = 15 point penalty)
const showFoulWarning = computed(() => consecutiveFouls.value >= 2)

const canUndoPlayer1 = computed(() => player1.value ? checkCanUndo(player1.value.id) : false)
const canUndoPlayer2 = computed(() => player2.value ? checkCanUndo(player2.value.id) : false)

const winnerName = computed(() => {
  if (!gameState.value?.winnerId) return ''
  if (gameState.value.winnerId === player1.value?.id) return player1.value?.name
  if (gameState.value.winnerId === player2.value?.id) return player2.value?.name
  return ''
})

// Rack tracking computed properties
const ballsInCurrentRack = computed(() => gameState.value?.ballsInCurrentRack || 0)
const needsRerack = computed(() => gameState.value?.needsRerack || false)
const remainingBallsInRack = computed(() => 14 - ballsInCurrentRack.value)

// Foul option (opening break foul - incoming player chooses)
const awaitingFoulOption = computed(() => gameState.value?.awaitingFoulOption || false)
const foulingPlayerName = computed(() => {
  if (!gameState.value?.foulingPlayer) return ''
  return gameState.value.foulingPlayer === 'player1' ? player1.value?.name : player2.value?.name
})
const incomingPlayerId = computed(() => {
  // The incoming player is the opponent of the fouling player
  if (!gameState.value?.foulingPlayer) return null
  return gameState.value.foulingPlayer === 'player1' ? player2.value?.id : player1.value?.id
})
const incomingPlayerName = computed(() => {
  if (!gameState.value?.foulingPlayer) return ''
  return gameState.value.foulingPlayer === 'player1' ? player2.value?.name : player1.value?.name
})
// Check if the current logged-in user is the incoming player (who makes the foul option choice)
const isIncomingPlayer = computed(() => {
  if (!currentPlayer.value || !incomingPlayerId.value) return false
  return currentPlayer.value.id === incomingPlayerId.value
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
  // Record any balls made before the scratch
  if (ballCount.value > 0) {
    await recordBallsMade(currentPlayerId.value, ballCount.value)
  }
  await recordFoul(currentPlayerId.value)
  ballCount.value = 0
}

async function handleFoul() {
  if (!currentPlayerId.value) return
  // Record any balls made before the foul (scenario 4)
  if (ballCount.value > 0) {
    await recordBallsMade(currentPlayerId.value, ballCount.value)
  }
  await recordFoul(currentPlayerId.value)
  ballCount.value = 0
}

async function handleSafety() {
  if (!currentPlayerId.value) return
  // Record any balls made before the safety (scenario 5)
  if (ballCount.value > 0) {
    await recordBallsMade(currentPlayerId.value, ballCount.value)
  }
  await recordSafety(currentPlayerId.value)
  ballCount.value = 0
}

async function handleMiss() {
  if (!currentPlayerId.value) return
  // Record any balls made before the miss
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
  if (!incomingPlayerId.value) return
  await recordFoulOption(incomingPlayerId.value, 'accept_table')
}

async function handleForceRebreak() {
  if (!incomingPlayerId.value) return
  await recordFoulOption(incomingPlayerId.value, 'force_rebreak')
}

async function handleUndo() {
  // Undo for whoever can undo (most recent player with actions)
  if (canUndoPlayer1.value && player1.value) {
    await undoLastAction(player1.value.id)
  } else if (canUndoPlayer2.value && player2.value) {
    await undoLastAction(player2.value.id)
  }
}

async function handleConfirmEndGame() {
  showEndGameConfirm.value = false
  if (!currentPlayer.value) return
  await endGame(currentPlayer.value.id, 'abandoned')
}

async function handleRematch() {
  if (!game.value) return

  try {
    // Create new game with same settings
    const { data: newGame, error: gameError } = await supabase
      .from('games')
      .insert({
        session_id: game.value.sessionId,
        game_number: game.value.gameNumber + 1,
        target_score: game.value.targetScore,
        allow_negative_score: game.value.allowNegativeScore,
        // Alternate first break
        first_break: game.value.firstBreak === 'player1' ? 'player2' : 'player1',
        player1_handicap: game.value.player1Handicap,
        player2_handicap: game.value.player2Handicap,
        status: 'active',
      })
      .select()
      .single()

    if (gameError) throw gameError

    // Reload the page to get new game
    await loadGame(game.value.sessionId)

    if (newGame) {
      // Re-subscribe to new game
      if (unsubscribe) unsubscribe()
      unsubscribe = subscribeToGame(newGame.id)
    }
  } catch (err) {
    console.error('Failed to create rematch:', err)
  }
}

function handleNewOpponent() {
  // Navigate to create a new session (will get a new join code for a new opponent)
  navigateTo('/session/create')
}

// Initialize
onMounted(async () => {
  const joinCode = route.params.code as string
  const result = await loadGameByCode(joinCode)

  if (result.success && game.value) {
    unsubscribe = subscribeToGame(game.value.id)
  }
})

// Watch for remaining balls changing and adjust ball count if needed
watch(remainingBallsInRack, (newRemaining) => {
  if (ballCount.value > newRemaining && newRemaining > 0) {
    ballCount.value = newRemaining
  } else if (newRemaining === 0) {
    ballCount.value = 0
  }
})

// Cleanup
onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

// Page meta
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

useHead({
  title: t('app.name') + ' - Game',
})
</script>
