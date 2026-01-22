<template>
  <main class="flex-1 flex items-start justify-center p-4 sm:p-6 pt-6 sm:pt-8">
    <div class="w-full max-w-lg bg-bg-secondary rounded-2xl p-6 sm:p-8 ring-1 ring-white/10">
      <h1 class="text-2xl font-semibold text-center mb-8">{{ $t('setup.title') }}</h1>

      <!-- Loading state -->
      <div v-if="pageLoading" class="flex flex-col items-center gap-4 py-8">
        <div class="spinner" />
        <p class="text-sm/6 text-text-secondary">{{ $t('common.loading') }}</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="flex flex-col items-center gap-4 text-center">
        <p class="text-sm/6 text-error">{{ error }}</p>
        <NuxtLink to="/" class="btn btn--primary">
          {{ $t('common.back') }}
        </NuxtLink>
      </div>

      <!-- Setup form -->
      <div v-else class="flex flex-col gap-8">
        <!-- Players section -->
        <section class="flex flex-col gap-4">
          <h2 class="text-lg font-semibold pb-2 border-b border-white/10">Players</h2>

          <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <!-- Player 1 (always on left) -->
            <PlayerForm
              player-label="Player 1"
              :player-name="isPlayer1 ? playerName : ''"
              :player-data="player1Data"
              :is-current-player="isPlayer1"
              @update-player="handleUpdatePlayer"
              @update:player-name="isPlayer1 && (playerName = $event)"
            />

            <!-- Player 2 (always on right) -->
            <PlayerForm
              player-label="Player 2"
              :player-name="!isPlayer1 ? playerName : ''"
              :player-data="player2Data"
              :is-current-player="!isPlayer1"
              @update-player="handleUpdatePlayer"
              @update:player-name="!isPlayer1 && (playerName = $event)"
            />
          </div>

          <!-- Player 2 ready button -->
          <div v-if="!isPlayer1 && !isCreator" class="flex justify-center">
            <button
              class="btn btn--primary"
              :disabled="!playerName.trim()"
              @click="handlePlayerReady"
            >
              {{ $t('setup.ready') }}
            </button>
          </div>
        </section>

        <!-- Game settings (only shown to session creator) -->
        <section v-if="isCreator" class="flex flex-col gap-4">
          <h2 class="text-lg font-semibold pb-2 border-b border-white/10">Game Settings</h2>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label for="targetScore" class="text-sm/6 text-text-secondary">{{ $t('setup.targetScore') }}</label>
              <select id="targetScore" v-model.number="gameSettings.targetScore">
                <option :value="50">50</option>
                <option :value="75">75</option>
                <option :value="100">100</option>
                <option :value="125">125</option>
                <option :value="150">150</option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <label for="firstBreak" class="text-sm/6 text-text-secondary">{{ $t('setup.firstBreak') }}</label>
              <select id="firstBreak" v-model="gameSettings.firstBreak">
                <option value="player1">{{ player1Name }}</option>
                <option value="player2">{{ player2Name }}</option>
              </select>
            </div>

            <!-- Manual handicap settings -->
            <div class="col-span-2 flex flex-col gap-1">
              <h3 class="text-base font-medium mb-2">Handicap (Optional)</h3>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                  <label for="player1Handicap" class="text-sm/6 text-text-secondary">{{ player1Name }} starts at</label>
                  <input
                    id="player1Handicap"
                    v-model.number="gameSettings.player1Handicap"
                    type="number"
                    min="-50"
                    max="50"
                    placeholder="0"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label for="player2Handicap" class="text-sm/6 text-text-secondary">{{ player2Name }} starts at</label>
                  <input
                    id="player2Handicap"
                    v-model.number="gameSettings.player2Handicap"
                    type="number"
                    min="-50"
                    max="50"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Waiting for creator to start (non-creator view) -->
        <section v-if="!isCreator" class="flex flex-col gap-4">
          <div class="flex flex-col items-center gap-4 p-8 text-center">
            <div class="animate-bounce-dots flex gap-1">
              <span class="bg-accent" />
              <span class="bg-accent" />
              <span class="bg-accent" />
            </div>
            <p class="text-sm/6 text-text-secondary">Waiting for {{ creatorName }} to start the game...</p>
          </div>
        </section>

        <!-- Start button (creator only) -->
        <div v-if="isCreator" class="mt-4">
          <button
            class="btn btn--primary btn--large w-full"
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
import PlayerForm from '~/components/setup/PlayerForm.vue'

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
  loadSessionByCode,
  updatePlayer,
  subscribeToSession,
} = useSession()

const pageLoading = ref(true)
const playerName = ref('')
let unsubscribe: (() => void) | null = null

const gameSettings = reactive({
  targetScore: 100,
  firstBreak: 'player1' as PlayerRole,
  player1Handicap: 0,
  player2Handicap: 0,
})

// Computed properties for player data by role (not by perspective)
const player1Data = computed(() => {
  if (isPlayer1.value) {
    return {
      name: playerName.value,
    }
  }
  return opponent.value
})

const player2Data = computed(() => {
  if (!isPlayer1.value) {
    return {
      name: playerName.value,
    }
  }
  return opponent.value
})

const player1Name = computed(() => {
  return player1Data.value?.name || 'Player 1'
})

const player2Name = computed(() => {
  return player2Data.value?.name || 'Player 2'
})

const creatorName = computed(() => {
  if (isCreator.value) {
    return playerName.value || 'Host'
  }
  return opponent.value?.name || 'Host'
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
  })
}

async function handlePlayerReady() {
  if (!playerName.value.trim()) return
  
  await handleUpdatePlayer()
  // Could add additional "ready" status logic here if needed
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
        allow_negative_score: true,
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

    // Navigate to the game using join code
    navigateTo(`/session/${session.value.joinCode}/game`)
  } catch (err) {
    console.error('Failed to start game:', err)
  }
}

// Initialize
onMounted(async () => {
  const joinCode = route.params.code as string

  const result = await loadSessionByCode(joinCode)

  if (result.success && session.value) {
    // Populate local state from loaded player
    playerName.value = currentPlayer.value?.name || ''

    // Debug: Log session and creator info
    console.log('Setup page loaded:', {
      joinCode,
      session: session.value,
      currentPlayer: currentPlayer.value,
      opponent: opponent.value,
      isCreator: isCreator.value,
      isPlayer1: isPlayer1.value,
    })

    // Subscribe to realtime updates (use session ID for subscriptions)
    unsubscribe = subscribeToSession(session.value.id)
  }

  pageLoading.value = false
})

// Auto-focus player name field
nextTick(() => {
  const playerNameInput = document.getElementById('playerName')
  if (playerNameInput) {
    playerNameInput.focus()
  }
})

// Watch for session becoming active (game started)
watch(
  () => session.value?.status,
  (newStatus) => {
    if (newStatus === 'active' && session.value) {
      navigateTo(`/session/${session.value.joinCode}/game`)
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
