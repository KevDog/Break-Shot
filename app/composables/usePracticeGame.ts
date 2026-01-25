import type {
  Game,
  GameEvent,
  GameStateProjection,
  PlayerStateProjection,
  Player,
  BallsMadePayload,
} from '~~/shared/types'
import { computeProjection, getDisplayScore, canUndo } from '~~/shared/game/projection'

interface PracticeGameState {
  game: Game | null
  events: GameEvent[]
  player: Player | null
  loading: boolean
  error: string | null
  // Practice-specific stats
  sessionStartTime: number
  totalInnings: number
  sessionHighRun: number
}

interface PracticeSession {
  id: string
  playerName: string
  targetScore: number | null // null for endless mode
  startedAt: string
  completedAt?: string
  finalScore: number
  highRun: number
  totalBalls: number
  totalInnings: number
  totalFouls: number
  timeElapsed: number
}

const STORAGE_KEY = 'break-shot-practice-game'
const HISTORY_KEY = 'break-shot-practice-history'
const MAX_HISTORY = 20

export function usePracticeGame() {
  const state = useState<PracticeGameState>('practiceGame', () => ({
    game: null,
    events: [],
    player: null,
    loading: false,
    error: null,
    sessionStartTime: 0,
    totalInnings: 0,
    sessionHighRun: 0,
  }))

  // Load game from localStorage on init
  onMounted(() => {
    loadFromStorage()
  })

  // Save to localStorage on state changes
  watchEffect(() => {
    if (state.value.game) {
      saveToStorage()
    }
  })

  // Computed projections
  const projection = computed(() => {
    if (!state.value.game || !state.value.player) return null
    
    // For practice mode, we only have one player
    const mockPlayer2: Player = {
      id: 'dummy',
      name: 'Dummy',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    return computeProjection({
      game: state.value.game,
      events: state.value.events,
      player1Id: state.value.player.id,
      player2Id: mockPlayer2.id,
    })
  })

  const gameState = computed((): GameStateProjection | null => {
    return projection.value?.gameState ?? null
  })

  const playerState = computed((): PlayerStateProjection | null => {
    if (!projection.value || !state.value.player) return null
    return projection.value.player1State
  })

  const displayScore = computed((): number => {
    return playerState.value ? getDisplayScore(playerState.value) : 0
  })

  // Practice-specific computed stats
  const timeElapsed = computed((): number => {
    if (!state.value.sessionStartTime) return 0
    return Math.floor((Date.now() - state.value.sessionStartTime) / 1000)
  })

  const averageBallsPerInning = computed((): number => {
    if (state.value.totalInnings === 0) return 0
    const totalBalls = playerState.value?.totalScore || 0
    return Math.round((totalBalls / state.value.totalInnings) * 10) / 10
  })

  const progressPercentage = computed((): number => {
    if (!state.value.game?.targetScore) return 0
    return Math.min(100, Math.round((displayScore.value / state.value.game.targetScore) * 100))
  })

  // Create a new practice session
  function createPracticeSession(params: {
    playerName: string
    targetScore: number | null // null for endless mode
  }) {
    const gameId = `practice-${Date.now()}`
    
    state.value.player = {
      id: 'player1',
      name: params.playerName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    state.value.game = {
      id: gameId,
      sessionId: gameId,
      gameNumber: 1,
      targetScore: params.targetScore || 999999, // Large number for endless mode
      player1Handicap: 0,
      player2Handicap: 0,
      allowNegativeScore: false,
      firstBreak: 'player1',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    state.value.events = []
    state.value.error = null
    state.value.sessionStartTime = Date.now()
    state.value.totalInnings = 1 // Start with 1 inning
    state.value.sessionHighRun = 0
    
    saveToStorage()
  }

  // Record game events
  async function recordBallsMade(ballCount: number): Promise<void> {
    if (!state.value.game || !state.value.player || ballCount === 0) return

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId: state.value.player.id,
      eventType: 'balls_made',
      payload: { count: ballCount } as BallsMadePayload,
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(event)
    
    // Update session high run
    const currentRun = playerState.value?.currentRun || 0
    if (currentRun > state.value.sessionHighRun) {
      state.value.sessionHighRun = currentRun
    }
    
    saveToStorage()
  }

  async function recordFoul(): Promise<void> {
    if (!state.value.game || !state.value.player) return

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId: state.value.player.id,
      eventType: 'foul',
      payload: {},
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(event)
    endInning()
    saveToStorage()
  }

  async function recordSafety(): Promise<void> {
    if (!state.value.game || !state.value.player) return

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId: state.value.player.id,
      eventType: 'safety',
      payload: {},
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(event)
    endInning()
    saveToStorage()
  }

  async function recordEndTurn(): Promise<void> {
    if (!state.value.game || !state.value.player) return

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId: state.value.player.id,
      eventType: 'end_turn',
      payload: {},
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(event)
    endInning()
    saveToStorage()
  }

  async function recordRerack(): Promise<void> {
    if (!state.value.game || !state.value.player) return

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId: state.value.player.id,
      eventType: 'rerack',
      payload: {},
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(event)
    saveToStorage()
  }

  async function undoLastAction(): Promise<void> {
    if (!state.value.game || !state.value.player) return

    // Find the last non-undone event
    const playerEvents = state.value.events
      .filter(e => e.playerId === state.value.player?.id && !e.undone)
      .sort((a, b) => b.sequenceNumber - a.sequenceNumber)

    if (playerEvents.length === 0) return

    const eventToUndo = playerEvents[0]
    
    // Create undo event
    const undoEvent: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId: state.value.player.id,
      eventType: 'undo',
      payload: { targetEventId: eventToUndo.id },
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(undoEvent)
    saveToStorage()
  }

  async function endSession(): Promise<void> {
    if (!state.value.game || !state.value.player) return

    // Save session to history
    const session: PracticeSession = {
      id: state.value.game.id,
      playerName: state.value.player.name,
      targetScore: state.value.game.targetScore === 999999 ? null : state.value.game.targetScore,
      startedAt: state.value.game.createdAt,
      completedAt: new Date().toISOString(),
      finalScore: displayScore.value,
      highRun: state.value.sessionHighRun,
      totalBalls: displayScore.value,
      totalInnings: state.value.totalInnings,
      totalFouls: playerState.value?.totalFouls || 0,
      timeElapsed: timeElapsed.value,
    }

    saveSessionToHistory(session)
    
    // Update game status
    state.value.game.status = 'completed'
    saveToStorage()
  }

  function checkCanUndo(): boolean {
    if (!state.value.game || !state.value.events.length || !state.value.player) return false
    return canUndo(state.value.events, state.value.player.id)
  }

  // Helper function to track innings
  function endInning() {
    state.value.totalInnings++
  }

  // Storage functions
  function saveToStorage() {
    if (typeof window === 'undefined') return
    
    const data = {
      game: state.value.game,
      events: state.value.events,
      player: state.value.player,
      sessionStartTime: state.value.sessionStartTime,
      totalInnings: state.value.totalInnings,
      sessionHighRun: state.value.sessionHighRun,
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function loadFromStorage() {
    if (typeof window === 'undefined') return
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    
    try {
      const data = JSON.parse(stored)
      state.value.game = data.game
      state.value.events = data.events || []
      state.value.player = data.player
      state.value.sessionStartTime = data.sessionStartTime || 0
      state.value.totalInnings = data.totalInnings || 1
      state.value.sessionHighRun = data.sessionHighRun || 0
    } catch (e) {
      console.error('Failed to load practice game from storage:', e)
    }
  }

  function clearSession() {
    state.value.game = null
    state.value.events = []
    state.value.player = null
    state.value.error = null
    state.value.sessionStartTime = 0
    state.value.totalInnings = 0
    state.value.sessionHighRun = 0
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Session history management
  function saveSessionToHistory(session: PracticeSession) {
    if (typeof window === 'undefined') return
    
    const historyStr = localStorage.getItem(HISTORY_KEY)
    const history: PracticeSession[] = historyStr ? JSON.parse(historyStr) : []
    
    // Add new session at beginning
    history.unshift(session)
    
    // Keep only MAX_HISTORY sessions
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }

  function getSessionHistory(): PracticeSession[] {
    if (typeof window === 'undefined') return []
    
    const historyStr = localStorage.getItem(HISTORY_KEY)
    return historyStr ? JSON.parse(historyStr) : []
  }

  function getPersonalBest(): { score: number; highRun: number } {
    const history = getSessionHistory()
    if (history.length === 0) return { score: 0, highRun: 0 }
    
    const bestScore = Math.max(...history.map(s => s.finalScore))
    const bestHighRun = Math.max(...history.map(s => s.highRun))
    
    return { score: bestScore, highRun: bestHighRun }
  }

  return {
    // State
    game: computed(() => state.value.game),
    player: computed(() => state.value.player),
    loading: computed(() => state.value.loading),
    error: computed(() => state.value.error),
    
    // Projections
    gameState,
    playerState,
    displayScore,
    
    // Practice-specific stats
    timeElapsed,
    averageBallsPerInning,
    progressPercentage,
    sessionHighRun: computed(() => state.value.sessionHighRun),
    totalInnings: computed(() => state.value.totalInnings),
    
    // Actions
    createPracticeSession,
    recordBallsMade,
    recordFoul,
    recordSafety,
    recordEndTurn,
    recordRerack,
    undoLastAction,
    endSession,
    checkCanUndo,
    clearSession,
    
    // History
    getSessionHistory,
    getPersonalBest,
  }
}