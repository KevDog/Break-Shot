import type { Session, Player, Game } from '~~/shared/types'

export interface SessionState {
  session: Session | null
  currentPlayer: Player | null
  opponent: Player | null
  currentGame: Game | null
  loading: boolean
  error: string | null
}

export function useSessionState() {
  const state = useState<SessionState>('session', () => ({
    session: null,
    currentPlayer: null,
    opponent: null,
    currentGame: null,
    loading: false,
    error: null,
  }))

  // Computed properties
  const isCreator = computed(() => {
    return state.value.currentPlayer?.role === 'player1'
  })

  const isPlayer1 = computed(() => {
    return state.value.currentPlayer?.role === 'player1'
  })

  // State getters
  const session = computed(() => state.value.session)
  const currentPlayer = computed(() => state.value.currentPlayer)
  const opponent = computed(() => state.value.opponent)
  const currentGame = computed(() => state.value.currentGame)
  const loading = computed(() => state.value.loading)
  const error = computed(() => state.value.error)

  // State setters
  function setLoading(loading: boolean) {
    state.value.loading = loading
  }

  function setError(error: string | null) {
    state.value.error = error
  }

  function setSession(session: Session | null) {
    state.value.session = session
  }

  function setCurrentPlayer(player: Player | null) {
    state.value.currentPlayer = player
  }

  function setOpponent(opponent: Player | null) {
    state.value.opponent = opponent
  }

  function setCurrentGame(game: Game | null) {
    state.value.currentGame = game
  }

  function clearState() {
    state.value = {
      session: null,
      currentPlayer: null,
      opponent: null,
      currentGame: null,
      loading: false,
      error: null,
    }
  }

  return {
    // State
    state: readonly(state),
    
    // Computed
    session,
    currentPlayer,
    opponent,
    currentGame,
    loading,
    error,
    isCreator,
    isPlayer1,
    
    // Actions
    setLoading,
    setError,
    setSession,
    setCurrentPlayer,
    setOpponent,
    setCurrentGame,
    clearState,
  }
}