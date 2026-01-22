// Main session composable that combines all session functionality
import { useSessionState } from './useSessionState'
import { useSessionAPI } from './useSessionAPI'
import { useSessionRealtime } from './useSessionRealtime'

export { useSessionState } from './useSessionState'
export { useSessionAPI } from './useSessionAPI'
export { useSessionRealtime } from './useSessionRealtime'

// Convenience function that provides the most commonly used session features
export function useSession() {
  const state = useSessionState()
  const api = useSessionAPI()
  const realtime = useSessionRealtime()

  return {
    // State
    ...state,
    
    // API methods
    ...api,
    
    // Realtime
    ...realtime,
  }
}