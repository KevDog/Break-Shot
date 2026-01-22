import type { Session, Player, Game, PlayerRole } from '~~/shared/types'
import type { Database } from '~/types/database.types'
import { generateJoinCode } from '~~/shared/utils/joinCode'
import { useSessionState } from './useSessionState'

export function useSessionAPI() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const {
    setLoading,
    setError,
    setSession,
    setCurrentPlayer,
    setOpponent,
    session,
    currentPlayer,
  } = useSessionState()

  // Create a new session
  async function createSession(): Promise<{ success: boolean; joinCode?: string }> {
    if (!user.value) {
      setError('You must be logged in to create a session')
      return { success: false }
    }

    setLoading(true)
    setError(null)

    try {
      const joinCode = generateJoinCode()

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        throw new Error('Not authenticated with Supabase')
      }

      // Create session
      console.log('Creating session with join code:', joinCode)
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          join_code: joinCode,
          status: 'waiting',
          created_by: authUser.id,
        })
        .select()
        .single()

      console.log('Session creation result:', { sessionData, sessionError })
      if (sessionError) throw sessionError

      // Create player 1 record
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          session_id: sessionData.id,
          user_id: authUser.id,
          role: 'player1' as PlayerRole,
          name: '',
        })
        .select()
        .single()

      if (playerError) throw playerError

      setSession({
        id: sessionData.id,
        joinCode: sessionData.join_code,
        status: sessionData.status,
        createdAt: sessionData.created_at,
        createdBy: sessionData.created_by,
      })

      setCurrentPlayer({
        id: player.id,
        sessionId: player.session_id,
        role: player.role as PlayerRole,
        name: player.name,
      })

      setLoading(false)
      return { success: true, joinCode }
    } catch (err) {
      console.error('Create session error:', err)
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : err instanceof Error
        ? err.message
        : 'Failed to create session'
      
      setError(errorMessage)
      setLoading(false)
      return { success: false }
    }
  }

  // Join existing session
  async function joinSession(joinCode: string): Promise<{ success: boolean }> {
    if (!user.value) {
      setError('You must be logged in to join a session')
      return { success: false }
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        throw new Error('Not authenticated with Supabase')
      }

      // Find session
      const normalizedCode = joinCode.toLowerCase().trim()
      console.log('Looking for session with join code:', normalizedCode)
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('join_code', normalizedCode)
        .single()

      console.log('Session query result:', { sessionData, sessionError })

      if (sessionError || !sessionData) {
        console.error('Session not found - Error:', sessionError)
        throw new Error('Session not found')
      }

      // Check if user already in session
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionData.id)
        .eq('user_id', authUser.id)
        .single()

      let player = existingPlayer

      if (!existingPlayer) {
        // Create player 2 record
        const { data: newPlayer, error: playerError } = await supabase
          .from('players')
          .insert({
            session_id: sessionData.id,
            user_id: authUser.id,
            role: 'player2' as PlayerRole,
            name: '',
          })
          .select()
          .single()

        if (playerError) throw playerError
        player = newPlayer

        // Update session status to 'setup' when player 2 joins
        const { error: updateError } = await supabase
          .from('sessions')
          .update({ status: 'setup' })
          .eq('id', sessionData.id)

        if (updateError) {
          console.error('Failed to update session status:', updateError)
        }
      }

      setSession({
        id: sessionData.id,
        joinCode: sessionData.join_code,
        status: sessionData.status,
        createdAt: sessionData.created_at,
        createdBy: sessionData.created_by,
      })

      setCurrentPlayer({
        id: player.id,
        sessionId: player.session_id,
        role: player.role as PlayerRole,
        name: player.name,
      })

      setLoading(false)
      return { success: true }
    } catch (err) {
      console.error('Join session error:', err)
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : err instanceof Error
        ? err.message
        : 'Failed to join session'
      
      setError(errorMessage)
      setLoading(false)
      return { success: false }
    }
  }

  // Load session by join code
  async function loadSessionByCode(joinCode: string): Promise<{ success: boolean }> {
    if (!user.value) {
      setError('You must be logged in')
      return { success: false }
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        throw new Error('Not authenticated')
      }

      // Get session
      const normalizedCode = joinCode.toLowerCase().trim()
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('join_code', normalizedCode)
        .single()

      if (sessionError || !sessionData) {
        throw new Error('Session not found')
      }

      // Get current player
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionData.id)
        .eq('user_id', authUser.id)
        .single()

      if (playerError || !player) {
        throw new Error('You are not part of this session')
      }

      // Get opponent
      const { data: opponentData } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionData.id)
        .neq('user_id', authUser.id)
        .single()

      setSession({
        id: sessionData.id,
        joinCode: sessionData.join_code,
        status: sessionData.status,
        createdAt: sessionData.created_at,
        createdBy: sessionData.created_by,
      })

      setCurrentPlayer({
        id: player.id,
        sessionId: player.session_id,
        role: player.role as PlayerRole,
        name: player.name,
      })

      if (opponentData) {
        setOpponent({
          id: opponentData.id,
          sessionId: opponentData.session_id,
          role: opponentData.role as PlayerRole,
          name: opponentData.name,
        })
      }

      setLoading(false)
      return { success: true }
    } catch (err) {
      console.error('Load session error:', err)
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : err instanceof Error
        ? err.message
        : 'Failed to load session'
      
      setError(errorMessage)
      setLoading(false)
      return { success: false }
    }
  }

  // Update current player
  async function updatePlayer(updates: { name?: string }): Promise<void> {
    if (!currentPlayer.value) return

    try {
      const { error } = await supabase
        .from('players')
        .update({
          name: updates.name || currentPlayer.value.name,
        })
        .eq('id', currentPlayer.value.id)

      if (error) throw error

      // Update local state
      setCurrentPlayer({
        ...currentPlayer.value,
        name: updates.name || currentPlayer.value.name,
      })
    } catch (err) {
      console.error('Update player error:', err)
    }
  }

  return {
    createSession,
    joinSession,
    loadSessionByCode,
    updatePlayer,
  }
}