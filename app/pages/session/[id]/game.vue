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
            <span v-if="player1State" class="player-score__rack">
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
            <span v-if="player2State" class="player-score__rack">
              {{ $t('game.run') }}: {{ player2State.currentRun }}
            </span>
            <span v-if="player2State && player2State.consecutiveFouls > 0" class="player-score__fouls">
              {{ $t('game.fouls') }}: {{ player2State.consecutiveFouls }}
            </span>
          </div>
        </div>
      </section>

      <!-- Consecutive foul warning -->
      <div
        v-if="showFoulWarning"
        class="foul-warning"
        :class="{ 'foul-warning--critical': consecutiveFouls === 2 }"
      >
        {{ $t('warnings.consecutiveFouls', { count: consecutiveFouls }) }}
      </div>

      <!-- Game completed banner -->
      <div v-if="gameState?.status === 'completed'" class="game-complete">
        <h2>{{ $t('gameEnd.title') }}</h2>
        <p class="game-complete__winner">
          {{ $t('gameEnd.winner') }}: {{ winnerName }}
        </p>
        <div class="game-complete__actions">
          <button class="btn btn--primary" @click="handleRematch">
            {{ $t('gameEnd.rematch') }}
          </button>
          <button class="btn btn--secondary" @click="handleEndSession">
            {{ $t('gameEnd.endSession') }}
          </button>
        </div>
      </div>

      <!-- Scoring controls -->
      <section v-if="gameState?.status === 'active'" class="scoring-controls">
        <!-- Turn indicator -->
        <div class="turn-indicator">
          {{ isPlayer1Turn ? player1?.name : player2?.name }}'s {{ $t('game.yourTurn').toLowerCase() }}
        </div>

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
            :disabled="ballCount >= 14"
            @click="incrementBalls"
          >
            +
          </button>
        </div>

        <!-- Action buttons -->
        <div class="action-buttons">
          <button
            class="btn btn--primary btn--large action-btn"
            :disabled="ballCount === 0"
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
              {{ $t('game.endTurn') }}
            </button>
            <button
              class="btn btn--secondary action-btn"
              @click="handleRerack"
            >
              {{ $t('game.rerack') }}
            </button>
          </div>
        </div>

        <!-- Secondary actions -->
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
  recordBallsMade,
  recordFoul,
  recordSafety,
  recordEndTurn,
  recordRerack,
  undoLastAction,
  checkCanUndo,
  subscribeToGame,
  endGame,
} = useGame()

const ballCount = ref(1)
const showEndGameConfirm = ref(false)
let unsubscribe: (() => void) | null = null

// Computed
const isPlayer1Turn = computed(() => gameState.value?.currentTurn === 'player1')

const currentPlayerId = computed(() => {
  return isPlayer1Turn.value ? player1.value?.id : player2.value?.id
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

// Methods
function incrementBalls() {
  if (ballCount.value < 14) {
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
  ballCount.value = 1
}

async function handleFoul() {
  if (!currentPlayerId.value) return
  await recordFoul(currentPlayerId.value)
  ballCount.value = 1
}

async function handleSafety() {
  if (!currentPlayerId.value) return
  await recordSafety(currentPlayerId.value)
  ballCount.value = 1
}

async function handleMiss() {
  if (!currentPlayerId.value) return
  await recordEndTurn(currentPlayerId.value)
  ballCount.value = 1
}

async function handleRerack() {
  if (!currentPlayerId.value) return
  await recordRerack(currentPlayerId.value)
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
  await endGame('abandoned')
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

// Initialize
onMounted(async () => {
  const sessionId = route.params.id as string
  const result = await loadGame(sessionId)

  if (result.success && game.value) {
    unsubscribe = subscribeToGame(game.value.id)
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
