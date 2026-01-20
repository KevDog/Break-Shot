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
        <div
          class="flex flex-col items-center gap-1 p-4 rounded-xl transition-all duration-100"
          :class="{
            'bg-bg-elevated ring-2 ring-accent': gameState?.currentTurn === 'player1',
            'bg-success/10 ring-2 ring-success': gameState?.winnerId === player1?.id,
          }"
        >
          <span class="text-sm/6 font-medium" :class="gameState?.currentTurn === 'player1' ? 'text-accent' : 'text-text-secondary'">
            {{ player1?.name || 'Player 1' }}
          </span>
          <span class="text-4xl font-bold leading-none">{{ player1DisplayScore }}</span>
          <div class="flex flex-col items-center gap-0.5 text-xs text-text-muted">
            <span v-if="player1State" class="text-accent font-medium">
              Rack: {{ player1State.rackScore >= 0 ? '+' : '' }}{{ player1State.rackScore }}
            </span>
            <span v-if="player1State">
              {{ $t('game.run') }}: {{ player1State.currentRun }}
            </span>
            <span v-if="player1State && player1State.consecutiveFouls > 0" class="text-warning">
              {{ $t('game.fouls') }}: {{ player1State.consecutiveFouls }}
            </span>
          </div>
        </div>

        <!-- Game info -->
        <div class="flex flex-col items-center justify-center gap-1 px-2 text-xs text-text-secondary max-sm:col-span-2 max-sm:flex-row max-sm:justify-around max-sm:order-first max-sm:pb-4 max-sm:px-0 max-sm:border-b max-sm:border-white/10">
          <span>{{ $t('game.score') }}: {{ game.targetScore }}</span>
          <span>{{ $t('game.inning') }}: {{ gameState?.currentInning || 1 }}</span>
          <span>{{ $t('game.racks') }}: {{ gameState?.rerackCount || 0 }}</span>
        </div>

        <!-- Player 2 -->
        <div
          class="flex flex-col items-center gap-1 p-4 rounded-xl transition-all duration-100"
          :class="{
            'bg-bg-elevated ring-2 ring-accent': gameState?.currentTurn === 'player2',
            'bg-success/10 ring-2 ring-success': gameState?.winnerId === player2?.id,
          }"
        >
          <span class="text-sm/6 font-medium" :class="gameState?.currentTurn === 'player2' ? 'text-accent' : 'text-text-secondary'">
            {{ player2?.name || 'Player 2' }}
          </span>
          <span class="text-4xl font-bold leading-none max-sm:text-3xl">{{ player2DisplayScore }}</span>
          <div class="flex flex-col items-center gap-0.5 text-xs text-text-muted">
            <span v-if="player2State" class="text-accent font-medium">
              Rack: {{ player2State.rackScore >= 0 ? '+' : '' }}{{ player2State.rackScore }}
            </span>
            <span v-if="player2State">
              {{ $t('game.run') }}: {{ player2State.currentRun }}
            </span>
            <span v-if="player2State && player2State.consecutiveFouls > 0" class="text-warning">
              {{ $t('game.fouls') }}: {{ player2State.consecutiveFouls }}
            </span>
          </div>
        </div>
      </section>

      <!-- Balls Remaining - Prominent display -->
      <div
        class="flex flex-col items-center justify-center p-6 bg-bg-secondary rounded-2xl ring-1"
        :class="{
          'ring-warning': remainingBallsInRack <= 3 && !needsRerack,
          'ring-accent bg-accent/10': needsRerack,
          'ring-white/10': remainingBallsInRack > 3 && !needsRerack,
        }"
      >
        <span
          class="text-4xl font-bold leading-none"
          :class="{
            'text-warning': remainingBallsInRack <= 3 && !needsRerack,
            'text-accent': needsRerack,
            'text-text-primary': remainingBallsInRack > 3 && !needsRerack,
          }"
        >
          {{ remainingBallsInRack }}
        </span>
        <span class="text-sm/6 text-text-secondary mt-1">Balls Remaining</span>
      </div>

      <!-- Consecutive foul warning -->
      <div
        v-if="showFoulWarning"
        class="alert text-center"
        :class="consecutiveFouls === 2 ? 'alert--error font-semibold' : 'bg-warning/10 text-warning ring-warning/20'"
      >
        {{ $t('warnings.consecutiveFouls', { count: consecutiveFouls }) }}
      </div>

      <!-- Opening break foul option -->
      <div v-if="awaitingFoulOption" class="text-center p-8 bg-bg-secondary rounded-2xl ring-2 ring-warning">
        <h3 class="text-xl font-semibold text-warning mb-2">Opening Break Foul</h3>
        <p class="text-sm/6 text-text-secondary mb-2">{{ foulingPlayerName }} committed a foul on the opening break.</p>

        <!-- Incoming player sees choice buttons -->
        <template v-if="isIncomingPlayer">
          <p class="font-medium text-text-primary mb-6">Choose your option:</p>
          <div class="flex flex-col gap-3">
            <button class="btn btn--primary w-full" @click="handleAcceptTable">
              Accept Table
            </button>
            <button class="btn btn--secondary w-full" @click="handleForceRebreak">
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
      <div v-if="gameState?.status === 'completed'" class="text-center p-8 bg-bg-secondary rounded-2xl ring-1 ring-white/10">
        <h2 class="text-2xl font-semibold mb-4">{{ $t('gameEnd.title') }}</h2>
        <p class="text-lg text-success mb-8">
          {{ $t('gameEnd.winner') }}: {{ winnerName }}
        </p>
        <div class="flex flex-col gap-3">
          <button class="btn btn--primary w-full" @click="handleRematch">
            New Game (Same Players)
          </button>
          <button class="btn btn--secondary w-full" @click="handleNewOpponent">
            New Game (New Opponent)
          </button>
        </div>
      </div>

      <!-- Rerack required banner -->
      <div v-if="needsRerack && gameState?.status === 'active'" class="text-center p-8 bg-bg-secondary rounded-2xl ring-2 ring-accent">
        <h3 class="text-xl font-semibold text-accent mb-2">Rack Complete!</h3>
        <p class="text-sm/6 text-text-secondary mb-6">14 balls have been pocketed. Press Rerack to continue.</p>
        <button class="btn btn--primary btn--large" @click="handleRerack">
          {{ $t('game.rerack') }}
        </button>
      </div>

      <!-- Scoring controls -->
      <section v-if="gameState?.status === 'active' && !needsRerack && !awaitingFoulOption" class="flex flex-col gap-6">
        <!-- Turn indicator -->
        <div class="text-center text-lg font-semibold" :class="isMyTurn ? 'text-accent' : 'text-text-secondary'">
          <template v-if="isMyTurn">
            {{ $t('game.yourTurn') }}
          </template>
          <template v-else>
            {{ currentTurnPlayerName }}'s turn
          </template>
        </div>

        <!-- Scoring controls only shown to the player whose turn it is -->
        <template v-if="isMyTurn">
          <!-- Ball count input -->
          <div class="flex items-center justify-center gap-6">
            <button
              class="w-[60px] h-[60px] max-sm:w-[50px] max-sm:h-[50px] rounded-full bg-bg-secondary ring-1 ring-white/10 text-2xl max-sm:text-xl font-bold text-text-primary cursor-pointer transition-all duration-100 hover:not-disabled:bg-bg-elevated hover:not-disabled:ring-accent disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="ballCount <= 0"
              @click="decrementBalls"
            >
              -
            </button>
            <span class="text-4xl max-sm:text-3xl font-bold min-w-[80px] max-sm:min-w-[60px] text-center">{{ ballCount }}</span>
            <button
              class="w-[60px] h-[60px] max-sm:w-[50px] max-sm:h-[50px] rounded-full bg-bg-secondary ring-1 ring-white/10 text-2xl max-sm:text-xl font-bold text-text-primary cursor-pointer transition-all duration-100 hover:not-disabled:bg-bg-elevated hover:not-disabled:ring-accent disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="ballCount >= remainingBallsInRack"
              @click="incrementBalls"
            >
              +
            </button>
          </div>

          <!-- Action buttons -->
          <div class="flex flex-col gap-4">
            <button
              class="btn btn--primary btn--large w-full min-h-[56px]"
              :disabled="ballCount === 0 || ballCount > remainingBallsInRack"
              @click="handleScoreBalls"
            >
              {{ $t('game.ballsMade') }} ({{ ballCount }})
            </button>

            <div class="grid grid-cols-2 gap-4">
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

            <div class="grid grid-cols-2 gap-4">
              <button
                class="btn btn--secondary w-full min-h-[56px]"
                @click="handleMiss"
              >
                Miss
              </button>
              <button
                class="btn btn--secondary w-full min-h-[56px]"
                @click="handleRerack"
              >
                {{ $t('game.rerack') }}
              </button>
            </div>
          </div>
        </template>

        <!-- Waiting message for opponent's turn -->
        <template v-else>
          <div class="flex flex-col items-center gap-4 p-8 bg-bg-secondary rounded-2xl ring-1 ring-white/10">
            <div class="animate-bounce-dots flex gap-1">
              <span class="bg-accent" />
              <span class="bg-accent" />
              <span class="bg-accent" />
            </div>
            <p class="text-sm/6 text-text-secondary m-0">Waiting for {{ currentTurnPlayerName }} to play...</p>
          </div>
        </template>

        <!-- Secondary actions (always visible) -->
        <div class="flex justify-center gap-6 pt-4 border-t border-white/10">
          <button
            class="btn btn--ghost"
            :disabled="!canUndoPlayer1 && !canUndoPlayer2"
            @click="handleUndo"
          >
            {{ $t('game.undo') }}
          </button>
          <button class="btn btn--ghost text-error hover:bg-error/10" @click="showEndGameConfirm = true">
            {{ $t('game.endGame') }}
          </button>
        </div>
      </section>

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

async function handleFoul() {
  if (!currentPlayerId.value) return
  await recordFoul(currentPlayerId.value)
  ballCount.value = 0
}

async function handleSafety() {
  if (!currentPlayerId.value) return
  await recordSafety(currentPlayerId.value)
  ballCount.value = 0
}

async function handleMiss() {
  if (!currentPlayerId.value) return
  await recordEndTurn(currentPlayerId.value)
  ballCount.value = 0
}

async function handleRerack() {
  if (!currentPlayerId.value) return
  await recordRerack(currentPlayerId.value)
  // Reset ball count to 1 after rerack (new rack has 14 balls available)
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
