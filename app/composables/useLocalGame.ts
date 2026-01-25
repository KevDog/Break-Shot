import type {
  Game,
  GameEvent,
  GameStateProjection,
  PlayerStateProjection,
  Player,
  GameEventType,
  BallsMadePayload,
  FoulOptionChoice,
} from '~~/shared/types'
import { computeProjection, getDisplayScore, canUndo } from '~~/shared/game/projection'

interface LocalGameState {
  game: Game | null
  events: GameEvent[]
  player1: Player | null
  player2: Player | null
  loading: boolean
  error: string | null
}

const STORAGE_KEY = 'break-shot-local-game'

export function useLocalGame() {
  const state = useState<LocalGameState>('localGame', () => ({
    game: null,
    events: [],
    player1: null,
    player2: null,
    loading: false,
    error: null,
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
    if (!state.value.game) return null
    return computeProjection({
      game: state.value.game,
      events: state.value.events,
      player1Id: state.value.player1?.id,
      player2Id: state.value.player2?.id,
    })
  })

  const gameState = computed((): GameStateProjection | null => {
    return projection.value?.gameState ?? null
  })

  const player1State = computed((): PlayerStateProjection | null => {
    if (!projection.value || !state.value.player1) return null
    return projection.value.player1State
  })

  const player2State = computed((): PlayerStateProjection | null => {
    if (!projection.value || !state.value.player2) return null
    return projection.value.player2State
  })

  // Display scores
  const player1DisplayScore = computed((): number => {
    return player1State.value ? getDisplayScore(player1State.value) : 0
  })

  const player2DisplayScore = computed((): number => {
    return player2State.value ? getDisplayScore(player2State.value) : 0
  })

  // Create a new local game
  function createGame(params: {
    player1Name: string
    player2Name: string
    targetScore: number
    player1Handicap?: number
    player2Handicap?: number
    allowNegativeScore?: boolean
    firstBreak?: 'player1' | 'player2'
  }) {
    const gameId = `local-${Date.now()}`
    
    state.value.player1 = {
      id: 'player1',
      name: params.player1Name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    state.value.player2 = {
      id: 'player2',
      name: params.player2Name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    state.value.game = {
      id: gameId,
      sessionId: gameId,
      gameNumber: 1,
      targetScore: params.targetScore,
      player1Handicap: params.player1Handicap || 0,
      player2Handicap: params.player2Handicap || 0,
      allowNegativeScore: params.allowNegativeScore ?? false,
      firstBreak: params.firstBreak || 'player1',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    state.value.events = []
    state.value.error = null
    
    saveToStorage()
  }

  // Record game events
  async function recordBallsMade(playerId: string, ballCount: number): Promise<void> {
    if (!state.value.game || ballCount === 0) return

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId,
      eventType: 'balls_made',
      payload: { count: ballCount } as BallsMadePayload,
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(event)
    saveToStorage()
  }

  async function recordFoul(playerId: string): Promise<void> {
    if (!state.value.game) return

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId,
      eventType: 'foul',
      payload: {},
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(event)
    saveToStorage()
  }

  async function recordSafety(playerId: string): Promise<void> {
    if (!state.value.game) return

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId,
      eventType: 'safety',
      payload: {},
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(event)
    saveToStorage()
  }

  async function recordEndTurn(playerId: string): Promise<void> {
    if (!state.value.game) return

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId,
      eventType: 'end_turn',
      payload: {},
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(event)
    saveToStorage()
  }

  async function recordRerack(playerId: string): Promise<void> {
    if (!state.value.game) return

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId,
      eventType: 'rerack',
      payload: {},
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(event)
    saveToStorage()
  }

  async function recordFoulOption(playerId: string, choice: FoulOptionChoice): Promise<void> {
    if (!state.value.game) return

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId,
      eventType: 'foul_option',
      payload: { choice },
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(event)
    saveToStorage()
  }

  async function recordRackAdjustment(adjustment: { player1RackScore: number; player2RackScore: number; ballsRemaining: number }): Promise<void> {
    if (!state.value.game || !state.value.player1) return

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId: state.value.player1.id, // Use player1 as the recorder
      eventType: 'rack_adjustment',
      payload: adjustment,
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(event)
    saveToStorage()
  }

  async function undoLastAction(playerId: string): Promise<void> {
    if (!state.value.game) return

    // Find the last non-undone event for this player
    const playerEvents = state.value.events
      .filter(e => e.playerId === playerId && !e.undone)
      .sort((a, b) => b.sequenceNumber - a.sequenceNumber)

    if (playerEvents.length === 0) return

    const eventToUndo = playerEvents[0]
    
    // Create undo event
    const undoEvent: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId,
      eventType: 'undo',
      payload: { targetEventId: eventToUndo.id },
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(undoEvent)
    saveToStorage()
  }

  async function endGame(playerId: string, reason: 'completed' | 'abandoned'): Promise<void> {
    if (!state.value.game) return

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      gameId: state.value.game.id,
      playerId,
      eventType: 'game_end',
      payload: { reason },
      sequenceNumber: state.value.events.length + 1,
      undone: false,
      createdAt: new Date().toISOString(),
    }

    state.value.events.push(event)
    state.value.game.status = reason === 'completed' ? 'completed' : 'abandoned'
    saveToStorage()
  }

  function checkCanUndo(playerId: string): boolean {
    if (!state.value.game || !state.value.events.length) return false
    return canUndo(state.value.events, playerId)
  }

  // Storage functions
  function saveToStorage() {
    if (typeof window === 'undefined') return
    
    const data = {
      game: state.value.game,
      events: state.value.events,
      player1: state.value.player1,
      player2: state.value.player2,
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
      state.value.player1 = data.player1
      state.value.player2 = data.player2
    } catch (e) {
      console.error('Failed to load local game from storage:', e)
    }
  }

  function clearGame() {
    state.value.game = null
    state.value.events = []
    state.value.player1 = null
    state.value.player2 = null
    state.value.error = null
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  function rematch() {
    if (!state.value.game || !state.value.player1 || !state.value.player2) return

    createGame({
      player1Name: state.value.player1.name,
      player2Name: state.value.player2.name,
      targetScore: state.value.game.targetScore,
      player1Handicap: state.value.game.player1Handicap,
      player2Handicap: state.value.game.player2Handicap,
      allowNegativeScore: state.value.game.allowNegativeScore,
      // Alternate first break
      firstBreak: state.value.game.firstBreak === 'player1' ? 'player2' : 'player1',
    })
  }

  return {
    // State
    game: computed(() => state.value.game),
    player1: computed(() => state.value.player1),
    player2: computed(() => state.value.player2),
    loading: computed(() => state.value.loading),
    error: computed(() => state.value.error),
    
    // Projections
    gameState,
    player1State,
    player2State,
    player1DisplayScore,
    player2DisplayScore,
    
    // Actions
    createGame,
    recordBallsMade,
    recordFoul,
    recordSafety,
    recordEndTurn,
    recordRerack,
    recordRackAdjustment,
    recordFoulOption,
    undoLastAction,
    endGame,
    checkCanUndo,
    clearGame,
    rematch,
  }
}