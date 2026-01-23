import type { Database } from '~/types/database.types'
import type { PlayerRole } from '~~/shared/types'
import { useSessionState } from './useSessionState'

export function useSessionRealtime() {
  const supabase = useSupabaseClient<Database>()
  const { setOpponent, setSession, currentPlayer, session } = useSessionState()

  // Subscribe to session updates
  function subscribeToSession(sessionId: string): (() => void) {
    console.log('Setting up realtime subscriptions for session:', sessionId)
    
    const playersSubscription = supabase
      .channel(`players-changes-${sessionId}`)
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
      .channel(`session-changes-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log('Session change received:', payload)
          
          if (payload.new && session.value) {
            const updatedSession = payload.new as any
            console.log('Updating session status from', session.value.status, 'to', updatedSession.status)
            setSession({
              ...session.value,
              status: updatedSession.status,
            })
            console.log('Session updated, new status:', session.value.status)
          }
        }
      )
      .subscribe((status) => {
        console.log('Session subscription status:', status)
      })

    // Return cleanup function
    return () => {
      console.log('Cleaning up subscriptions')
      playersSubscription.unsubscribe()
      sessionsSubscription.unsubscribe()
    }
  }

  return {
    subscribeToSession,
  }
}