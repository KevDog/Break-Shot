import type { Session, Player, Game, PlayerRole } from '~~/shared/types'
import type { Database } from '~/types/database.types'
import { generateJoinCode } from '~~/shared/utils/joinCode'

interface SessionState {
  session: Session | null
  currentPlayer: Player | null
  opponent: Player | null
  currentGame: Game | null
  loading: boolean
  error: string | null
}

export function useSession() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const state = useState<SessionState>('session', () => ({
    session: null,
    currentPlayer: null,
    opponent: null,
    currentGame: null,
    loading: false,
    error: null,
  }))

  // Create a new session
  async function createSession(): Promise<{ success: boolean; joinCode?: string }> {
    if (!user.value) {
      state.value.error = 'You must be logged in to create a session'
      return { success: false }
    }

    state.value.loading = true
    state.value.error = null

    try {
      const joinCode = generateJoinCode()

      // Debug: Verify auth state matches
      const { data: { user: authUser } } = await supabase.auth.getUser()
      console.log('Auth user ID:', authUser?.id)
      console.log('Composable user ID:', user.value.id)
      console.log('IDs match:', authUser?.id === user.value.id)

      if (!authUser) {
        throw new Error('Not authenticated with Supabase')
      }

      // Create session using the auth user ID directly
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          join_code: joinCode,
          status: 'waiting',
          created_by: authUser.id,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Create player 1 record
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          session_id: session.id,
          user_id: authUser.id,
          role: 'player1' as PlayerRole,
          name: '',
        })
        .select()
        .single()

      if (playerError) throw playerError

      state.value.session = {
        id: session.id,
        joinCode: session.join_code,
        status: session.status,
        createdAt: session.created_at,
        createdBy: session.created_by,
      }

      state.value.currentPlayer = {
        id: player.id,
        sessionId: player.session_id,
        role: player.role as PlayerRole,
        name: player.name,
        fargoRating: player.fargo_rating ?? undefined,
      }

      state.value.loading = false
      return { success: true, joinCode }
    } catch (err) {
      console.error('Create session error:', err)
      // Handle Supabase error format
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : err instanceof Error
          ? err.message
          : 'Failed to create session'
      state.value.error = errorMessage
      state.value.loading = false
      return { success: false }
    }
  }

  // Join an existing session
  async function joinSession(joinCode: string): Promise<{ success: boolean }> {
    if (!user.value) {
      state.value.error = 'You must be logged in to join a session'
      return { success: false }
    }

    state.value.loading = true
    state.value.error = null

    try {
      // Get auth user directly for RLS compatibility
      const { data: { user: authUser } } = await supabase.auth.getUser()
      console.log('Join - Auth user ID:', authUser?.id)

      if (!authUser) {
        throw new Error('Not authenticated with Supabase')
      }

      // Find session by join code
      const normalizedCode = joinCode.toLowerCase().trim()
      console.log('Looking for session with join code:', normalizedCode)
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select()
        .eq('join_code', normalizedCode)
        .eq('status', 'waiting')
        .maybeSingle()

      console.log('Session lookup result:', { session, sessionError })

      if (sessionError) {
        console.error('Session lookup error:', sessionError)
        throw new Error('Error looking up session')
      }

      if (!session) {
        throw new Error('Session not found. Check the code and make sure the session is still waiting for a player.')
      }

      // Check if user is already in this session
      const { data: existingPlayer } = await supabase
        .from('players')
        .select()
        .eq('session_id', session.id)
        .eq('user_id', authUser.id)
        .single()

      if (existingPlayer) {
        throw new Error('You are already in this session')
      }

      // Create player 2 record
      console.log('Creating player 2 record')
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          session_id: session.id,
          user_id: authUser.id,
          role: 'player2' as PlayerRole,
          name: '',
        })
        .select()
        .single()

      console.log('Player insert result:', { player, playerError })
      if (playerError) throw playerError

      // Update session status to setup using RPC function (bypasses RLS)
      console.log('Updating session status to setup via RPC')
      const { error: updateError } = await supabase
        .rpc('join_session', {
          p_session_id: session.id,
          p_user_id: authUser.id,
        })

      console.log('Session update result:', { updateError })
      if (updateError) throw updateError

      // Get opponent (player 1) - use user_id since we know the creator
      console.log('Getting opponent for session:', session.id, 'created by:', session.created_by)
      const { data: opponent, error: opponentError } = await supabase
        .from('players')
        .select()
        .eq('session_id', session.id)
        .eq('user_id', session.created_by)
        .maybeSingle()

      console.log('Opponent lookup result:', { opponent, opponentError })
      if (opponentError) throw opponentError

      // If we can't find the opponent due to RLS, create a minimal opponent object
      // The realtime subscription will update this once properly synced
      const opponentData = opponent || {
        id: 'pending',
        session_id: session.id,
        role: 'player1' as const,
        name: '',
        fargo_rating: null,
      }

      state.value.session = {
        id: session.id,
        joinCode: session.join_code,
        status: 'setup',
        createdAt: session.created_at,
        createdBy: session.created_by,
      }

      state.value.currentPlayer = {
        id: player.id,
        sessionId: player.session_id,
        role: player.role as PlayerRole,
        name: player.name,
        fargoRating: player.fargo_rating ?? undefined,
      }

      state.value.opponent = {
        id: opponentData.id,
        sessionId: opponentData.session_id,
        role: opponentData.role as PlayerRole,
        name: opponentData.name,
        fargoRating: opponentData.fargo_rating ?? undefined,
      }

      state.value.loading = false
      return { success: true }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to join session'
      state.value.loading = false
      return { success: false }
    }
  }

  // Load existing session
  async function loadSession(sessionId: string): Promise<{ success: boolean }> {
    state.value.loading = true
    state.value.error = null

    try {
      // Get auth user directly for RLS compatibility
      const { data: { user: authUser } } = await supabase.auth.getUser()
      console.log('LoadSession - Auth user ID:', authUser?.id)

      if (!authUser) {
        state.value.error = 'You must be logged in'
        state.value.loading = false
        return { success: false }
      }

      // Get session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select()
        .eq('id', sessionId)
        .maybeSingle()

      console.log('LoadSession - Session result:', { session, sessionError })

      if (sessionError || !session) {
        throw new Error('Session not found')
      }

      // Get current player
      const { data: currentPlayer, error: playerError } = await supabase
        .from('players')
        .select()
        .eq('session_id', sessionId)
        .eq('user_id', authUser.id)
        .maybeSingle()

      console.log('LoadSession - Current player result:', { currentPlayer, playerError })

      if (playerError || !currentPlayer) {
        throw new Error('You are not part of this session')
      }

      // Get opponent
      const opponentRole = currentPlayer.role === 'player1' ? 'player2' : 'player1'
      const { data: opponent } = await supabase
        .from('players')
        .select()
        .eq('session_id', sessionId)
        .eq('role', opponentRole)
        .maybeSingle()

      // Get active game if exists
      const { data: game } = await supabase
        .from('games')
        .select()
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .order('game_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      state.value.session = {
        id: session.id,
        joinCode: session.join_code,
        status: session.status,
        createdAt: session.created_at,
        createdBy: session.created_by,
      }

      state.value.currentPlayer = {
        id: currentPlayer.id,
        sessionId: currentPlayer.session_id,
        role: currentPlayer.role as PlayerRole,
        name: currentPlayer.name,
        fargoRating: currentPlayer.fargo_rating ?? undefined,
      }

      if (opponent) {
        state.value.opponent = {
          id: opponent.id,
          sessionId: opponent.session_id,
          role: opponent.role as PlayerRole,
          name: opponent.name,
          fargoRating: opponent.fargo_rating ?? undefined,
        }
      }

      if (game) {
        state.value.currentGame = {
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
      }

      state.value.loading = false
      return { success: true }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to load session'
      state.value.loading = false
      return { success: false }
    }
  }

  // Update current player info
  async function updatePlayer(data: { name?: string; fargoRating?: number }): Promise<{ success: boolean }> {
    if (!state.value.currentPlayer) {
      state.value.error = 'No player loaded'
      return { success: false }
    }

    try {
      const { error } = await supabase
        .from('players')
        .update({
          name: data.name,
          fargo_rating: data.fargoRating,
        })
        .eq('id', state.value.currentPlayer.id)

      if (error) throw error

      if (data.name !== undefined) {
        state.value.currentPlayer.name = data.name
      }
      if (data.fargoRating !== undefined) {
        state.value.currentPlayer.fargoRating = data.fargoRating
      }

      return { success: true }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to update player'
      return { success: false }
    }
  }

  // Subscribe to session changes (realtime)
  function subscribeToSession(sessionId: string) {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new && state.value.session) {
            const newSession = payload.new as Record<string, unknown>
            state.value.session.status = newSession.status as Session['status']
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new) {
            const newPlayer = payload.new as Record<string, unknown>
            // If this is the opponent joining
            if (newPlayer.user_id !== user.value?.id) {
              state.value.opponent = {
                id: newPlayer.id as string,
                sessionId: newPlayer.session_id as string,
                role: newPlayer.role as PlayerRole,
                name: newPlayer.name as string,
                fargoRating: (newPlayer.fargo_rating as number) ?? undefined,
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new) {
            const updatedPlayer = payload.new as Record<string, unknown>
            // Update opponent if it's their record
            if (state.value.opponent && updatedPlayer.id === state.value.opponent.id) {
              state.value.opponent.name = updatedPlayer.name as string
              state.value.opponent.fargoRating = (updatedPlayer.fargo_rating as number) ?? undefined
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // Clear session state
  function clearSession() {
    state.value.session = null
    state.value.currentPlayer = null
    state.value.opponent = null
    state.value.currentGame = null
    state.value.error = null
  }

  return {
    // State
    session: computed(() => state.value.session),
    currentPlayer: computed(() => state.value.currentPlayer),
    opponent: computed(() => state.value.opponent),
    currentGame: computed(() => state.value.currentGame),
    loading: computed(() => state.value.loading),
    error: computed(() => state.value.error),

    // Computed
    isCreator: computed(() => state.value.session?.createdBy === user.value?.id),
    isPlayer1: computed(() => state.value.currentPlayer?.role === 'player1'),

    // Actions
    createSession,
    joinSession,
    loadSession,
    updatePlayer,
    subscribeToSession,
    clearSession,
  }
}
