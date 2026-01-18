<template>
  <main class="setup-page">
    <div class="setup-card">
      <h1 class="setup-card__title">{{ $t('setup.title') }}</h1>

      <!-- Loading state -->
      <div v-if="pageLoading" class="setup-card__loading">
        <div class="spinner" />
        <p>{{ $t('common.loading') }}</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="setup-card__error">
        <p>{{ error }}</p>
        <NuxtLink to="/" class="btn btn--primary">
          {{ $t('common.back') }}
        </NuxtLink>
      </div>

      <!-- Setup form -->
      <div v-else class="setup-card__content">
        <!-- Players section -->
        <section class="setup-section">
          <h2 class="setup-section__title">Players</h2>

          <div class="players-grid">
            <!-- Current player -->
            <div class="player-setup">
              <span class="player-setup__role">{{ isPlayer1 ? 'Player 1' : 'Player 2' }}</span>
              <div class="player-setup__field">
                <label for="playerName">{{ $t('setup.playerName') }}</label>
                <input
                  id="playerName"
                  v-model="playerName"
                  type="text"
                  :placeholder="$t('setup.playerName')"
                  @blur="handleUpdatePlayer"
                />
              </div>
              <div class="player-setup__field">
                <label for="fargoRating">{{ $t('setup.fargoRating') }}</label>
                <input
                  id="fargoRating"
                  v-model.number="fargoRating"
                  type="number"
                  min="100"
                  max="900"
                  :placeholder="$t('setup.fargoRating')"
                  @blur="handleUpdatePlayer"
                />
              </div>
            </div>

            <!-- Opponent -->
            <div class="player-setup player-setup--opponent">
              <span class="player-setup__role">{{ isPlayer1 ? 'Player 2' : 'Player 1' }}</span>
              <div class="player-setup__field">
                <label>{{ $t('setup.playerName') }}</label>
                <div class="player-setup__value">
                  {{ opponent?.name || $t('session.waiting') }}
                </div>
              </div>
              <div class="player-setup__field">
                <label>{{ $t('setup.fargoRating') }}</label>
                <div class="player-setup__value">
                  {{ opponent?.fargoRating || '-' }}
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Game settings (only shown to session creator) -->
        <section v-if="isCreator" class="setup-section">
          <h2 class="setup-section__title">Game Settings</h2>

          <div class="settings-grid">
            <div class="setting-field">
              <label for="targetScore">{{ $t('setup.targetScore') }}</label>
              <select id="targetScore" v-model.number="gameSettings.targetScore">
                <option :value="50">50</option>
                <option :value="75">75</option>
                <option :value="100">100</option>
                <option :value="125">125</option>
                <option :value="150">150</option>
              </select>
            </div>

            <div class="setting-field">
              <label for="firstBreak">{{ $t('setup.firstBreak') }}</label>
              <select id="firstBreak" v-model="gameSettings.firstBreak">
                <option value="player1">{{ player1Name }}</option>
                <option value="player2">{{ player2Name }}</option>
              </select>
            </div>

            <div class="setting-field setting-field--full">
              <label class="checkbox-label">
                <input
                  v-model="gameSettings.allowNegativeScore"
                  type="checkbox"
                />
                <span>{{ $t('setup.allowNegative') }}</span>
              </label>
            </div>

            <!-- Handicap settings -->
            <div v-if="showHandicapSection" class="setting-field setting-field--full">
              <h3 class="setting-field__subtitle">{{ $t('setup.handicap') }}</h3>

              <div v-if="recommendedHandicap" class="handicap-recommendation">
                <span>{{ $t('setup.recommendedHandicap') }}:</span>
                <strong>{{ recommendedHandicapDisplay }}</strong>
                <button class="btn btn--sm btn--secondary" @click="applyRecommendedHandicap">
                  Apply
                </button>
              </div>

              <div class="handicap-inputs">
                <div class="handicap-field">
                  <label for="player1Handicap">{{ player1Name }} starts at</label>
                  <input
                    id="player1Handicap"
                    v-model.number="gameSettings.player1Handicap"
                    type="number"
                    min="-50"
                    max="50"
                  />
                </div>
                <div class="handicap-field">
                  <label for="player2Handicap">{{ player2Name }} starts at</label>
                  <input
                    id="player2Handicap"
                    v-model.number="gameSettings.player2Handicap"
                    type="number"
                    min="-50"
                    max="50"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Waiting for creator to start (non-creator view) -->
        <section v-if="!isCreator" class="setup-section">
          <div class="waiting-for-start">
            <div class="waiting-indicator__dots">
              <span />
              <span />
              <span />
            </div>
            <p>Waiting for {{ creatorName }} to start the game...</p>
          </div>
        </section>

        <!-- Start button (creator only) -->
        <div v-if="isCreator" class="setup-card__actions">
          <button
            class="btn btn--primary btn--large btn--full"
            :disabled="!canStartGame"
            @click="handleStartGame"
          >
            {{ $t('setup.startGame') }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { PlayerRole } from '~~/shared/types'
import { calculateRecommendedHandicap } from '~~/shared/game/projection'

const route = useRoute()
const { t } = useI18n()
const supabase = useSupabaseClient()

const {
  session,
  currentPlayer,
  opponent,
  loading,
  error,
  isCreator,
  isPlayer1,
  loadSession,
  updatePlayer,
  subscribeToSession,
} = useSession()

const pageLoading = ref(true)
const playerName = ref('')
const fargoRating = ref<number | undefined>(undefined)
let unsubscribe: (() => void) | null = null

const gameSettings = reactive({
  targetScore: 100,
  firstBreak: 'player1' as PlayerRole,
  allowNegativeScore: true,
  player1Handicap: 0,
  player2Handicap: 0,
})

// Computed properties
const player1Name = computed(() => {
  if (isPlayer1.value) {
    return playerName.value || 'Player 1'
  }
  return opponent.value?.name || 'Player 1'
})

const player2Name = computed(() => {
  if (!isPlayer1.value) {
    return playerName.value || 'Player 2'
  }
  return opponent.value?.name || 'Player 2'
})

const creatorName = computed(() => {
  if (isCreator.value) {
    return playerName.value || 'Host'
  }
  return opponent.value?.name || 'Host'
})

const showHandicapSection = computed(() => {
  const player1Rating = isPlayer1.value ? fargoRating.value : opponent.value?.fargoRating
  const player2Rating = isPlayer1.value ? opponent.value?.fargoRating : fargoRating.value
  return player1Rating && player2Rating
})

const recommendedHandicap = computed(() => {
  const player1Rating = isPlayer1.value ? fargoRating.value : opponent.value?.fargoRating
  const player2Rating = isPlayer1.value ? opponent.value?.fargoRating : fargoRating.value

  if (player1Rating && player2Rating) {
    return calculateRecommendedHandicap(player1Rating, player2Rating, gameSettings.targetScore)
  }
  return null
})

const recommendedHandicapDisplay = computed(() => {
  if (!recommendedHandicap.value) return ''
  const { player1Handicap, player2Handicap } = recommendedHandicap.value
  if (player1Handicap > 0) {
    return `${player1Name.value} +${player1Handicap}`
  } else if (player2Handicap > 0) {
    return `${player2Name.value} +${player2Handicap}`
  }
  return 'Even'
})

const canStartGame = computed(() => {
  return (
    opponent.value !== null &&
    playerName.value.trim() !== '' &&
    opponent.value.name.trim() !== ''
  )
})

// Methods
async function handleUpdatePlayer() {
  await updatePlayer({
    name: playerName.value,
    fargoRating: fargoRating.value,
  })
}

function applyRecommendedHandicap() {
  if (recommendedHandicap.value) {
    gameSettings.player1Handicap = recommendedHandicap.value.player1Handicap
    gameSettings.player2Handicap = recommendedHandicap.value.player2Handicap
  }
}

async function handleStartGame() {
  if (!session.value || !canStartGame.value) return

  try {
    // Create the game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        session_id: session.value.id,
        game_number: 1,
        target_score: gameSettings.targetScore,
        allow_negative_score: gameSettings.allowNegativeScore,
        first_break: gameSettings.firstBreak,
        player1_handicap: gameSettings.player1Handicap,
        player2_handicap: gameSettings.player2Handicap,
        status: 'active',
      })
      .select()
      .single()

    if (gameError) throw gameError

    // Update session status to active
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ status: 'active' })
      .eq('id', session.value.id)

    if (sessionError) throw sessionError

    // Navigate to the game
    navigateTo(`/session/${session.value.id}/game`)
  } catch (err) {
    console.error('Failed to start game:', err)
  }
}

// Initialize
onMounted(async () => {
  const sessionId = route.params.id as string

  const result = await loadSession(sessionId)

  if (result.success) {
    // Populate local state from loaded player
    playerName.value = currentPlayer.value?.name || ''
    fargoRating.value = currentPlayer.value?.fargoRating

    // Subscribe to realtime updates
    unsubscribe = subscribeToSession(sessionId)
  }

  pageLoading.value = false
})

// Watch for session becoming active (game started)
watch(
  () => session.value?.status,
  (newStatus) => {
    if (newStatus === 'active' && session.value) {
      navigateTo(`/session/${session.value.id}/game`)
    }
  }
)

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
  title: t('setup.title') + ' - Break Shot',
})
</script>

<style scoped>
.setup-page {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--spacing-lg);
  padding-top: var(--spacing-xl);
}

.setup-card {
  width: 100%;
  max-width: 500px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.setup-card__title {
  font-size: var(--font-size-2xl);
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.setup-card__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl) 0;
}

.setup-card__loading p {
  color: var(--color-text-secondary);
}

.setup-card__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  text-align: center;
}

.setup-card__error p {
  color: var(--color-error);
}

.setup-card__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.setup-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.setup-section__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-bg-elevated);
}

.players-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

@media (max-width: 480px) {
  .players-grid {
    grid-template-columns: 1fr;
  }
}

.player-setup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--color-bg-elevated);
  border-radius: var(--radius-md);
}

.player-setup__role {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.player-setup__field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.player-setup__field label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.player-setup__field input {
  width: 100%;
}

.player-setup__value {
  padding: var(--spacing-sm);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  min-height: calc(var(--button-height) - var(--spacing-xs));
  display: flex;
  align-items: center;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.setting-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.setting-field label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.setting-field select {
  width: 100%;
}

.setting-field--full {
  grid-column: 1 / -1;
}

.setting-field__subtitle {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-sm);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}

.checkbox-label input {
  width: auto;
}

.handicap-recommendation {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

.handicap-recommendation strong {
  color: var(--color-accent);
}

.handicap-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.handicap-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.handicap-field label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.handicap-field input {
  width: 100%;
}

.waiting-for-start {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-secondary);
}

.waiting-indicator__dots {
  display: flex;
  gap: var(--spacing-xs);
}

.waiting-indicator__dots span {
  width: 8px;
  height: 8px;
  background-color: var(--color-accent);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.waiting-indicator__dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.waiting-indicator__dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.setup-card__actions {
  margin-top: var(--spacing-md);
}

.setup-card__actions .btn {
  width: 100%;
}

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

.btn--sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  min-height: auto;
}
</style>
