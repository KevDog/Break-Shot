<template>
  <main class="game-page">
    <!-- Loading state -->
    <div v-if="loading" class="game-page__loading">
      <div class="spinner" />
      <p>{{ $t('common.loading') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="game-page__error">
      <p>{{ error }}</p>
      <NuxtLink to="/" class="btn btn--primary">
        {{ $t('common.back') }}
      </NuxtLink>
    </div>

    <!-- Game view -->
    <div v-else-if="game" class="game-view">
      <!-- Scoreboard -->
      <section class="scoreboard">
        <!-- Player 1 -->
        <div
          class="player-score"
          :class="{
            'player-score--active': gameState?.currentTurn === 'player1',
            'player-score--winner': gameState?.winnerId === player1?.id,
          }"
        >
          <span class="player-score__name">{{ player1?.name || 'Player 1' }}</span>
          <span class="player-score__score">{{ player1DisplayScore }}</span>
          <div class="player-score__details">
            <span v-if="player1State" class="player-score__rack-score">
              Rack: {{ player1State.rackScore >= 0 ? '+' : '' }}{{ player1State.rackScore }}
            </span>
            <span v-if="player1State" class="player-score__run">
              {{ $t('game.run') }}: {{ player1State.currentRun }}
            </span>
            <span v-if="player1State && player1State.consecutiveFouls > 0" class="player-score__fouls">
              {{ $t('game.fouls') }}: {{ player1State.consecutiveFouls }}
            </span>
          </div>
        </div>

        <!-- Game info -->
        <div class="game-info">
          <span class="game-info__target">{{ $t('game.score') }}: {{ game.targetScore }}</span>
          <span class="game-info__inning">{{ $t('game.inning') }}: {{ gameState?.currentInning || 1 }}</span>
          <span class="game-info__racks">{{ $t('game.racks') }}: {{ gameState?.rerackCount || 0 }}</span>
        </div>

        <!-- Player 2 -->
        <div
          class="player-score"
          :class="{
            'player-score--active': gameState?.currentTurn === 'player2',
            'player-score--winner': gameState?.winnerId === player2?.id,
          }"
        >
          <span class="player-score__name">{{ player2?.name || 'Player 2' }}</span>
          <span class="player-score__score">{{ player2DisplayScore }}</span>
          <div class="player-score__details">
            <span v-if="player2State" class="player-score__rack-score">
              Rack: {{ player2State.rackScore >= 0 ? '+' : '' }}{{ player2State.rackScore }}
            </span>
            <span v-if="player2State" class="player-score__run">
              {{ $t('game.run') }}: {{ player2State.currentRun }}
            </span>
            <span v-if="player2State && player2State.consecutiveFouls > 0" class="player-score__fouls">
              {{ $t('game.fouls') }}: {{ player2State.consecutiveFouls }}
            </span>
          </div>
        </div>
      </section>

      <!-- Balls Remaining - Prominent display -->
      <div class="balls-remaining" :class="{ 'balls-remaining--low': remainingBallsInRack <= 3, 'balls-remaining--empty': needsRerack }">
        <span class="balls-remaining__count">{{ remainingBallsInRack }}</span>
        <span class="balls-remaining__label">Balls Remaining</span>
      </div>

      <!-- Consecutive foul warning -->
      <div
        v-if="showFoulWarning"
        class="foul-warning"
        :class="{ 'foul-warning--critical': consecutiveFouls === 2 }"
      >
        {{ $t('warnings.consecutiveFouls', { count: consecutiveFouls }) }}
      </div>

      <!-- Opening break foul option -->
      <div v-if="awaitingFoulOption" class="foul-option">
        <h3>Opening Break Foul</h3>
        <p>{{ foulingPlayerName }} committed a foul on the opening break.</p>

        <!-- Incoming player sees choice buttons -->
        <template v-if="isIncomingPlayer">
          <p class="foul-option__prompt">Choose your option:</p>
          <div class="foul-option__actions">
            <button class="btn btn--primary" @click="handleAcceptTable">
              Accept Table
            </button>
            <button class="btn btn--secondary" @click="handleForceRebreak">
              Force Rebreak
            </button>
          </div>
        </template>

        <!-- Fouling player sees waiting message -->
        <template v-else>
          <div class="foul-option__waiting">
            <div class="waiting-indicator__dots">
              <span />
              <span />
              <span />
            </div>
            <p>Waiting for {{ incomingPlayerName }} to decide...</p>
          </div>
        </template>
      </div>

      <!-- Game completed banner -->
      <div v-if="gameState?.status === 'completed'" class="game-complete">
        <h2>{{ $t('gameEnd.title') }}</h2>
        <p class="game-complete__winner">
          {{ $t('gameEnd.winner') }}: {{ winnerName }}
        </p>
        <div class="game-complete__actions">
          <button class="btn btn--primary" @click="handleRematch">
            New Game (Same Players)
          </button>
          <button class="btn btn--secondary" @click="handleNewOpponent">
            New Game (New Opponent)
          </button>
        </div>
      </div>

      <!-- Rerack required banner -->
      <div v-if="needsRerack && gameState?.status === 'active'" class="rerack-required">
        <h3>Rack Complete!</h3>
        <p>14 balls have been pocketed. Press Rerack to continue.</p>
        <button class="btn btn--primary btn--large" @click="handleRerack">
          {{ $t('game.rerack') }}
        </button>
      </div>

      <!-- Scoring controls -->
      <section v-if="gameState?.status === 'active' && !needsRerack && !awaitingFoulOption" class="scoring-controls">
        <!-- Turn indicator -->
        <div class="turn-indicator" :class="{ 'turn-indicator--waiting': !isMyTurn }">
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
          <div class="ball-input">
            <button
              class="ball-input__btn ball-input__btn--minus"
              :disabled="ballCount <= 0"
              @click="decrementBalls"
            >
              -
            </button>
            <span class="ball-input__count">{{ ballCount }}</span>
            <button
              class="ball-input__btn ball-input__btn--plus"
              :disabled="ballCount >= remainingBallsInRack"
              @click="incrementBalls"
            >
              +
            </button>
          </div>

          <!-- Action buttons -->
          <div class="action-buttons">
            <button
              class="btn btn--primary btn--large action-btn"
              :disabled="ballCount === 0 || ballCount > remainingBallsInRack"
              @click="handleScoreBalls"
            >
              {{ $t('game.ballsMade') }} ({{ ballCount }})
            </button>

            <div class="action-buttons__row">
              <button
                class="btn btn--secondary action-btn"
                @click="handleFoul"
              >
                {{ $t('game.foul') }}
              </button>
              <button
                class="btn btn--secondary action-btn"
                @click="handleSafety"
              >
                {{ $t('game.safety') }}
              </button>
            </div>

            <div class="action-buttons__row">
              <button
                class="btn btn--secondary action-btn"
                @click="handleMiss"
              >
                Miss
              </button>
              <button
                class="btn btn--secondary action-btn"
                @click="handleRerack"
              >
                {{ $t('game.rerack') }}
              </button>
            </div>
          </div>
        </template>

        <!-- Waiting message for opponent's turn -->
        <template v-else>
          <div class="waiting-for-turn">
            <div class="waiting-indicator__dots">
              <span />
              <span />
              <span />
            </div>
            <p>Waiting for {{ currentTurnPlayerName }} to play...</p>
          </div>
        </template>

        <!-- Secondary actions (always visible) -->
        <div class="secondary-actions">
          <button
            class="btn btn--ghost"
            :disabled="!canUndoPlayer1 && !canUndoPlayer2"
            @click="handleUndo"
          >
            {{ $t('game.undo') }}
          </button>
          <button class="btn btn--ghost btn--danger" @click="showEndGameConfirm = true">
            {{ $t('game.endGame') }}
          </button>
        </div>
      </section>

      <!-- End game confirmation modal -->
      <div v-if="showEndGameConfirm" class="modal-overlay" @click.self="showEndGameConfirm = false">
        <div class="modal">
          <h3>{{ $t('gameEnd.confirmEnd') }}</h3>
          <div class="modal__actions">
            <button class="btn btn--secondary" @click="showEndGameConfirm = false">
              {{ $t('common.cancel') }}
            </button>
            <button class="btn btn--danger" @click="handleConfirmEndGame">
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

const consecutiveFouls = computed(() => {
  if (isPlayer1Turn.value) {
    return player1State.value?.consecutiveFouls || 0
  }
  return player2State.value?.consecutiveFouls || 0
})

const showFoulWarning = computed(() => consecutiveFouls.value >= 1)

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

function handleEndSession() {
  navigateTo('/')
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

<style scoped>
.game-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
}

.game-page__loading,
.game-page__error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
}

.game-page__loading p,
.game-page__error p {
  color: var(--color-text-secondary);
}

.game-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

/* Scoreboard */
.scoreboard {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.player-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.player-score--active {
  background-color: var(--color-bg-elevated);
  box-shadow: 0 0 0 2px var(--color-accent);
}

.player-score--winner {
  background-color: rgba(0, 255, 136, 0.1);
  box-shadow: 0 0 0 2px var(--color-success);
}

.player-score__name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.player-score__score {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

.player-score--active .player-score__name {
  color: var(--color-accent);
}

.player-score__details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.player-score__rack-score {
  color: var(--color-accent);
  font-weight: var(--font-weight-medium);
}

.player-score__run {
  color: var(--color-text-muted);
}

.player-score__fouls {
  color: var(--color-warning);
}

.game-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: 0 var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Foul warning */
.foul-warning {
  text-align: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(255, 204, 0, 0.1);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  color: var(--color-warning);
  font-size: var(--font-size-sm);
}

.foul-warning--critical {
  background-color: rgba(255, 68, 68, 0.1);
  border-color: var(--color-error);
  color: var(--color-error);
  font-weight: var(--font-weight-semibold);
}

/* Foul option (opening break) */
.foul-option {
  text-align: center;
  padding: var(--spacing-xl);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-warning);
}

.foul-option h3 {
  font-size: var(--font-size-xl);
  color: var(--color-warning);
  margin-bottom: var(--spacing-sm);
}

.foul-option p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.foul-option__prompt {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary) !important;
  margin-bottom: var(--spacing-lg) !important;
}

.foul-option__actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.foul-option__actions .btn {
  width: 100%;
}

.foul-option__waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) 0;
}

.foul-option__waiting p {
  margin-bottom: 0;
}

.foul-option__waiting .waiting-indicator__dots {
  display: flex;
  gap: var(--spacing-xs);
}

.foul-option__waiting .waiting-indicator__dots span {
  width: 8px;
  height: 8px;
  background-color: var(--color-warning);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.foul-option__waiting .waiting-indicator__dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.foul-option__waiting .waiting-indicator__dots span:nth-child(2) {
  animation-delay: -0.16s;
}

/* Game complete */
.game-complete {
  text-align: center;
  padding: var(--spacing-xl);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
}

.game-complete h2 {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--spacing-md);
}

.game-complete__winner {
  font-size: var(--font-size-lg);
  color: var(--color-success);
  margin-bottom: var(--spacing-xl);
}

.game-complete__actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.game-complete__actions .btn {
  width: 100%;
}

/* Rerack required banner */
.rerack-required {
  text-align: center;
  padding: var(--spacing-xl);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-accent);
}

.rerack-required h3 {
  font-size: var(--font-size-xl);
  color: var(--color-accent);
  margin-bottom: var(--spacing-sm);
}

.rerack-required p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

/* Balls Remaining - Prominent display */
.balls-remaining {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-bg-elevated);
}

.balls-remaining__count {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: 1;
  color: var(--color-text-primary);
}

.balls-remaining__label {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

.balls-remaining--low {
  border-color: var(--color-warning);
}

.balls-remaining--low .balls-remaining__count {
  color: var(--color-warning);
}

.balls-remaining--empty {
  border-color: var(--color-accent);
  background-color: rgba(0, 212, 255, 0.1);
}

.balls-remaining--empty .balls-remaining__count {
  color: var(--color-accent);
}

/* Scoring controls */
.scoring-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.turn-indicator {
  text-align: center;
  font-size: var(--font-size-lg);
  color: var(--color-accent);
  font-weight: var(--font-weight-medium);
}

.turn-indicator--waiting {
  color: var(--color-text-secondary);
}

/* Waiting for opponent's turn */
.waiting-for-turn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
}

.waiting-for-turn p {
  color: var(--color-text-secondary);
  margin: 0;
}

.waiting-for-turn .waiting-indicator__dots {
  display: flex;
  gap: var(--spacing-xs);
}

.waiting-for-turn .waiting-indicator__dots span {
  width: 8px;
  height: 8px;
  background-color: var(--color-accent);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.waiting-for-turn .waiting-indicator__dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.waiting-for-turn .waiting-indicator__dots span:nth-child(2) {
  animation-delay: -0.16s;
}

/* Ball input */
.ball-input {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
}

.ball-input__btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--color-bg-secondary);
  border: 2px solid var(--color-bg-elevated);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ball-input__btn:hover:not(:disabled) {
  background-color: var(--color-bg-elevated);
  border-color: var(--color-accent);
}

.ball-input__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.ball-input__count {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  min-width: 80px;
  text-align: center;
}

/* Action buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.action-buttons__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.action-btn {
  width: 100%;
  min-height: 56px;
}

/* Secondary actions */
.secondary-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-bg-elevated);
}

.btn--ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
}

.btn--ghost:hover:not(:disabled) {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.btn--danger {
  color: var(--color-error);
}

.btn--danger:hover:not(:disabled) {
  background-color: rgba(255, 68, 68, 0.1);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  z-index: 100;
}

.modal {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.modal h3 {
  margin-bottom: var(--spacing-xl);
}

.modal__actions {
  display: flex;
  gap: var(--spacing-md);
}

.modal__actions .btn {
  flex: 1;
}

/* Spinner */
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-bg-elevated);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .scoreboard {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
  }

  .game-info {
    grid-column: 1 / -1;
    flex-direction: row;
    justify-content: space-around;
    order: -1;
    padding: 0 0 var(--spacing-md) 0;
    border-bottom: 1px solid var(--color-bg-elevated);
  }

  .player-score__score {
    font-size: var(--font-size-3xl);
  }

  .ball-input__btn {
    width: 50px;
    height: 50px;
    font-size: var(--font-size-xl);
  }

  .ball-input__count {
    font-size: var(--font-size-3xl);
    min-width: 60px;
  }
}
</style>
