import type { Database } from '~/types/database.types'
import type { PlayerRole } from '~~/shared/types'
import { useSessionState } from './useSessionState'

export function useSessionRealtime() {
  const supabase = useSupabaseClient<Database>()
  const { setOpponent, setSession, currentPlayer, session } = useSessionState()

  // Subscribe to session updates
  function subscribeToSession(sessionId: string): (() => void) {
    const playersSubscription = supabase
      .channel('players-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log('Player change:', payload)
          
          // Only process updates for the opponent
          if (payload.new && currentPlayer.value) {
            const updatedPlayer = payload.new as any
            
            // Skip if this is the current player
            if (updatedPlayer.id === currentPlayer.value.id) return
            
            // Update opponent data
            setOpponent({
              id: updatedPlayer.id,
              sessionId: updatedPlayer.session_id,
              role: updatedPlayer.role as PlayerRole,
              name: updatedPlayer.name,
            })
          }
        }
      )
      .subscribe()

    const sessionsSubscription = supabase
      .channel('session-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log('Session change:', payload)
          
          if (payload.new && session.value) {
            const updatedSession = payload.new as any
            setSession({
              ...session.value,
              status: updatedSession.status,
            })
          }
        }
      )
      .subscribe()

    // Return cleanup function
    return () => {
      playersSubscription.unsubscribe()
      sessionsSubscription.unsubscribe()
    }
  }

  return {
    subscribeToSession,
  }
}