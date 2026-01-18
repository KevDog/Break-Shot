import type {
  Game,
  GameEvent,
  GameStateProjection,
  PlayerStateProjection,
  PlayerRole,
  GameEventType,
  BallsMadePayload,
  Player,
} from '~~/shared/types'
import type { Database } from '~/types/database.types'
import { computeProjection, getDisplayScore, canUndo } from '~~/shared/game/projection'

type DbGame = Database['public']['Tables']['games']['Row']
type DbPlayer = Database['public']['Tables']['players']['Row']
type DbGameEvent = Database['public']['Tables']['game_events']['Row']

interface GameState {
  game: Game | null
  events: GameEvent[]
  player1: Player | null
  player2: Player | null
  loading: boolean
  error: string | null
}

export function useGame() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const state = useState<GameState>('game', () => ({
    game: null,
    events: [],
    player1: null,
    player2: null,
    loading: false,
    error: null,
  }))

  // Computed projections
  const projection = computed(() => {
    if (!state.value.game) return null
    return computeProjection({
      game: state.value.game,
      events: state.value.events,
    })
  })

  const gameState = computed((): GameStateProjection | null => {
    return projection.value?.gameState ?? null
  })

  const player1State = computed((): PlayerStateProjection | null => {
    if (!projection.value || !state.value.player1) return null
    const p1State = projection.value.player1State
    p1State.playerId = state.value.player1.id
    return p1State
  })

  const player2State = computed((): PlayerStateProjection | null => {
    if (!projection.value || !state.value.player2) return null
    const p2State = projection.value.player2State
    p2State.playerId = state.value.player2.id
    return p2State
  })

  // Determine current player's role
  const currentPlayerRole = computed((): PlayerRole | null => {
    if (!user.value || !state.value.player1 || !state.value.player2) return null

    const { data: p1 } = state.value.player1 as unknown as { data: { user_id?: string } }
    const { data: p2 } = state.value.player2 as unknown as { data: { user_id?: string } }

    // Check raw data if needed, otherwise try direct comparison
    if (state.value.player1.id && user.value.id) {
      // Need to fetch user_id from players - this is stored in DB but not in our Player type
      // For now, we'll use a different approach
    }

    return null
  })

  const isMyTurn = computed((): boolean => {
    if (!gameState.value || !currentPlayerRole.value) return false
    return gameState.value.currentTurn === currentPlayerRole.value
  })

  // Display scores
  const player1DisplayScore = computed((): number => {
    return player1State.value ? getDisplayScore(player1State.value) : 0
  })

  const player2DisplayScore = computed((): number => {
    return player2State.value ? getDisplayScore(player2State.value) : 0
  })

  // Load game and events
  async function loadGame(sessionId: string): Promise<{ success: boolean }> {
    state.value.loading = true
    state.value.error = null

    try {
      // Get active game for this session
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select()
        .eq('session_id', sessionId)
        .in('status', ['active', 'completed'])
        .order('game_number', { ascending: false })
        .limit(1)
        .single()

      if (gameError || !gameData) throw new Error('Game not found')
      const game = gameData as unknown as DbGame

      // Get players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select()
        .eq('session_id', sessionId)

      if (playersError || !playersData) throw new Error('Failed to load players')
      const players = playersData as unknown as DbPlayer[]

      const player1 = players.find((p) => p.role === 'player1')
      const player2 = players.find((p) => p.role === 'player2')

      if (!player1 || !player2) throw new Error('Players not found')

      // Get game events
      const { data: eventsData, error: eventsError } = await supabase
        .from('game_events')
        .select()
        .eq('game_id', game.id)
        .order('sequence_number', { ascending: true })

      if (eventsError) throw eventsError
      const events = (eventsData || []) as unknown as DbGameEvent[]

      // Map database records to our types
      state.value.game = {
        id: game.id,
        sessionId: game.session_id,
        gameNumber: game.game_number,
        targetScore: game.target_score,
        allowNegativeScore: game.allow_negative_score,
        firstBreak: game.first_break as PlayerRole,
        player1Handicap: game.player1_handicap,
        player2Handicap: game.player2_handicap,
        status: game.status,
        startedAt: game.started_at,
      }

      state.value.player1 = {
        id: player1.id,
        sessionId: player1.session_id,
        role: player1.role as PlayerRole,
        name: player1.name,
        fargoRating: player1.fargo_rating ?? undefined,
      }

      state.value.player2 = {
        id: player2.id,
        sessionId: player2.session_id,
        role: player2.role as PlayerRole,
        name: player2.name,
        fargoRating: player2.fargo_rating ?? undefined,
      }

      state.value.events = events.map((e) => ({
        id: e.id,
        gameId: e.game_id,
        playerId: e.player_id,
        sequenceNumber: e.sequence_number,
        eventType: e.event_type as GameEventType,
        timestamp: e.timestamp,
        undone: e.undone,
        payload: (e.payload || {}) as Record<string, unknown>,
      })) as GameEvent[]

      state.value.loading = false
      return { success: true }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to load game'
      state.value.loading = false
      return { success: false }
    }
  }

  // Record an event
  async function recordEvent(
    playerId: string,
    eventType: GameEventType,
    payload: BallsMadePayload | Record<string, unknown> = {}
  ): Promise<{ success: boolean }> {
    if (!state.value.game) {
      state.value.error = 'No game loaded'
      return { success: false }
    }

    try {
      type GameEventInsert = Database['public']['Tables']['game_events']['Insert']
      const insertData: GameEventInsert = {
        game_id: state.value.game.id,
        player_id: playerId,
        event_type: eventType as GameEventInsert['event_type'],
        payload: JSON.parse(JSON.stringify(payload)),
      }

      const { data: eventData, error } = await supabase
        .from('game_events')
        .insert(insertData)
        .select()
        .single()

      if (error || !eventData) throw error || new Error('Failed to create event')
      const event = eventData as DbGameEvent

      // Add event to local state
      const newEvent: GameEvent = {
        id: event.id,
        gameId: event.game_id,
        playerId: event.player_id,
        sequenceNumber: event.sequence_number,
        eventType: event.event_type as GameEventType,
        timestamp: event.timestamp,
        undone: event.undone,
        payload: (event.payload || {}) as Record<string, unknown>,
      } as GameEvent

      state.value.events.push(newEvent)

      // Check for game end condition
      if (gameState.value?.status === 'completed' && state.value.game) {
        // Update game status in database
        await supabase
          .from('games')
          .update({ status: 'completed' })
          .eq('id', state.value.game.id)

        state.value.game.status = 'completed'
      }

      return { success: true }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to record event'
      return { success: false }
    }
  }

  // Record balls made
  async function recordBallsMade(playerId: string, count: number): Promise<{ success: boolean }> {
    return recordEvent(playerId, 'balls_made', { count })
  }

  // Record foul
  async function recordFoul(playerId: string): Promise<{ success: boolean }> {
    return recordEvent(playerId, 'foul', {})
  }

  // Record safety
  async function recordSafety(playerId: string): Promise<{ success: boolean }> {
    return recordEvent(playerId, 'safety', {})
  }

  // Record end turn (miss without foul)
  async function recordEndTurn(playerId: string): Promise<{ success: boolean }> {
    return recordEvent(playerId, 'end_turn', {})
  }

  // Record rerack (new rack)
  async function recordRerack(playerId: string): Promise<{ success: boolean }> {
    return recordEvent(playerId, 'rerack', {})
  }

  // Undo last action
  async function undoLastAction(playerId: string): Promise<{ success: boolean }> {
    const undoCheck = canUndo(state.value.events, playerId)

    if (!undoCheck.canUndo || !undoCheck.lastUndoableEventId) {
      state.value.error = 'Cannot undo - no actions to undo'
      return { success: false }
    }

    return recordEvent(playerId, 'undo', { targetEventId: undoCheck.lastUndoableEventId })
  }

  // Check if player can undo
  function checkCanUndo(playerId: string): boolean {
    return canUndo(state.value.events, playerId).canUndo
  }

  // Subscribe to game events (realtime)
  function subscribeToGame(gameId: string) {
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_events',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.new) {
            const e = payload.new as Record<string, unknown>

            // Check if we already have this event (from local insert)
            const exists = state.value.events.some((ev) => ev.id === e.id)
            if (exists) return

            const newEvent: GameEvent = {
              id: e.id as string,
              gameId: e.game_id as string,
              playerId: e.player_id as string,
              sequenceNumber: e.sequence_number as number,
              eventType: e.event_type as GameEventType,
              timestamp: e.created_at as string,
              undone: e.undone as boolean,
              payload: (e.payload || {}) as Record<string, unknown>,
            } as GameEvent

            state.value.events.push(newEvent)
            state.value.events.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.new && state.value.game) {
            const updatedGame = payload.new as Record<string, unknown>
            state.value.game.status = updatedGame.status as Game['status']
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // End game manually
  async function endGame(reason: 'target_reached' | 'abandoned', winnerId?: string): Promise<{ success: boolean }> {
    if (!state.value.game || !state.value.player1) {
      return { success: false }
    }

    try {
      // Record game_end event
      await recordEvent(state.value.player1.id, 'game_end', { reason, winnerId })

      // Update game status
      const { error } = await supabase
        .from('games')
        .update({ status: reason === 'target_reached' ? 'completed' : 'abandoned' })
        .eq('id', state.value.game.id)

      if (error) throw error

      state.value.game.status = reason === 'target_reached' ? 'completed' : 'abandoned'

      return { success: true }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to end game'
      return { success: false }
    }
  }

  // Clear game state
  function clearGame() {
    state.value.game = null
    state.value.events = []
    state.value.player1 = null
    state.value.player2 = null
    state.value.error = null
  }

  return {
    // State
    game: computed(() => state.value.game),
    events: computed(() => state.value.events),
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
    isMyTurn,

    // Actions
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
    clearGame,
  }
}
