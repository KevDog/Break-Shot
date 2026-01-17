// Break Shot - Game State Projection
// Computes game state from event stream (event sourcing)
// Based on requirements Section 6.4: Projection Logic

import type {
  Game,
  GameEvent,
  GameStateProjection,
  PlayerStateProjection,
  PlayerRole,
} from '../types'

interface ProjectionInput {
  game: Game
  events: GameEvent[]
}

interface ProjectionOutput {
  gameState: GameStateProjection
  player1State: PlayerStateProjection
  player2State: PlayerStateProjection
}

/**
 * Compute game state projection from event stream
 *
 * Algorithm:
 * 1. Initialize state from game config (handicaps as totalScore, rackScore = 0, first break)
 * 2. For each event (ordered by sequenceNumber), excluding undone events:
 *    - balls_made: add to rackScore, add to currentRun, update highRun if exceeded
 *    - foul: subtract 1 from rackScore, increment consecutiveFouls, increment totalFouls
 *            if consecutiveFouls == 3: subtract 15 more, reset consecutiveFouls
 *            end turn
 *    - safety: end turn (no score change)
 *    - end_turn: reset currentRun, switch turn, increment inning if player2 ended
 *    - rerack: add rackScore to totalScore, reset rackScore to 0, increment rerackCount
 *    - undo: mark target event as undone, recompute from beginning
 *    - game_end: set status, winnerId, endedAt
 * 3. Apply floor of zero if allowNegativeScore is false
 * 4. Display score = totalScore + rackScore
 */
export function computeProjection(input: ProjectionInput): ProjectionOutput {
  const { game, events } = input

  // Initialize game state
  const gameState: GameStateProjection = {
    gameId: game.id,
    currentTurn: game.firstBreak,
    currentInning: 1,
    rerackCount: 0,
    status: game.status,
    winnerId: undefined,
    endedAt: undefined,
  }

  // Initialize player states with handicaps
  const player1State: PlayerStateProjection = {
    playerId: '', // Will be set when we know player IDs
    gameId: game.id,
    totalScore: game.player1Handicap,
    rackScore: 0,
    currentRun: 0,
    highRun: 0,
    consecutiveFouls: 0,
    totalFouls: 0,
  }

  const player2State: PlayerStateProjection = {
    playerId: '',
    gameId: game.id,
    totalScore: game.player2Handicap,
    rackScore: 0,
    currentRun: 0,
    highRun: 0,
    consecutiveFouls: 0,
    totalFouls: 0,
  }

  // Build set of undone event IDs first
  const undoneEventIds = new Set<string>()
  for (const event of events) {
    if (event.undone) {
      undoneEventIds.add(event.id)
    }
    if (event.eventType === 'undo' && !event.undone) {
      undoneEventIds.add(event.payload.targetEventId)
    }
  }

  // Helper to get player state by role
  const getPlayerState = (role: PlayerRole): PlayerStateProjection => {
    return role === 'player1' ? player1State : player2State
  }

  // Helper to determine player role from player ID
  const getPlayerRole = (playerId: string): PlayerRole | null => {
    if (player1State.playerId === playerId) return 'player1'
    if (player2State.playerId === playerId) return 'player2'
    return null
  }

  // Helper to switch turns
  const switchTurn = (): void => {
    const currentPlayerState = getPlayerState(gameState.currentTurn)

    // Update high run before switching
    if (currentPlayerState.currentRun > currentPlayerState.highRun) {
      currentPlayerState.highRun = currentPlayerState.currentRun
    }

    // Reset current run
    currentPlayerState.currentRun = 0

    // If player2 just ended their turn, increment inning
    if (gameState.currentTurn === 'player2') {
      gameState.currentInning++
    }

    // Switch turn
    gameState.currentTurn = gameState.currentTurn === 'player1' ? 'player2' : 'player1'
  }

  // Helper to apply score floor
  const applyScoreFloor = (state: PlayerStateProjection): void => {
    if (!game.allowNegativeScore) {
      const displayScore = state.totalScore + state.rackScore
      if (displayScore < 0) {
        // Adjust rackScore to bring display score to 0
        state.rackScore = -state.totalScore
      }
    }
  }

  // Process events in sequence order
  const sortedEvents = [...events].sort((a, b) => a.sequenceNumber - b.sequenceNumber)

  for (const event of sortedEvents) {
    // Skip undone events
    if (undoneEventIds.has(event.id)) {
      continue
    }

    // Set player IDs on first encounter
    const role = event.playerId === player1State.playerId ? 'player1' :
                 event.playerId === player2State.playerId ? 'player2' : null

    if (role === null && event.eventType !== 'game_end') {
      // First time seeing this player, assign based on events seen so far
      if (!player1State.playerId) {
        player1State.playerId = event.playerId
      } else if (!player2State.playerId && event.playerId !== player1State.playerId) {
        player2State.playerId = event.playerId
      }
    }

    const playerRole = getPlayerRole(event.playerId)
    const playerState = playerRole ? getPlayerState(playerRole) : null

    switch (event.eventType) {
      case 'balls_made': {
        if (playerState) {
          const count = event.payload.count
          playerState.rackScore += count
          playerState.currentRun += count

          // Reset consecutive fouls on legal shot
          playerState.consecutiveFouls = 0

          // Update high run if current run exceeds it
          if (playerState.currentRun > playerState.highRun) {
            playerState.highRun = playerState.currentRun
          }

          // Check for win condition
          const displayScore = playerState.totalScore + playerState.rackScore
          if (displayScore >= game.targetScore) {
            gameState.status = 'completed'
            gameState.winnerId = event.playerId
            gameState.endedAt = event.timestamp
          }
        }
        break
      }

      case 'foul': {
        if (playerState) {
          // Deduct 1 point
          playerState.rackScore -= 1
          playerState.consecutiveFouls++
          playerState.totalFouls++

          // Three consecutive fouls = additional 15 point penalty
          if (playerState.consecutiveFouls === 3) {
            playerState.rackScore -= 15
            playerState.consecutiveFouls = 0
          }

          // Apply score floor
          applyScoreFloor(playerState)

          // End turn
          switchTurn()
        }
        break
      }

      case 'safety': {
        // Safety ends turn, no score change
        // Note: Any balls pocketed on a safety are not scored (SC-11)
        if (playerState) {
          // Reset consecutive fouls on legal shot
          playerState.consecutiveFouls = 0
        }
        switchTurn()
        break
      }

      case 'end_turn': {
        switchTurn()
        break
      }

      case 'rerack': {
        // Add rack scores to total scores for both players
        player1State.totalScore += player1State.rackScore
        player1State.rackScore = 0
        player2State.totalScore += player2State.rackScore
        player2State.rackScore = 0

        gameState.rerackCount++
        break
      }

      case 'undo': {
        // Undo events are handled by the undoneEventIds set above
        // The actual recomputation happens by skipping undone events
        break
      }

      case 'game_end': {
        gameState.status = event.payload.reason === 'target_reached' ? 'completed' : 'abandoned'
        gameState.winnerId = event.payload.winnerId
        gameState.endedAt = event.timestamp
        break
      }
    }
  }

  return {
    gameState,
    player1State,
    player2State,
  }
}

/**
 * Calculate display score (totalScore + rackScore)
 */
export function getDisplayScore(state: PlayerStateProjection): number {
  return state.totalScore + state.rackScore
}

/**
 * Check if a player can undo (has actions since opponent's last action)
 */
export function canUndo(
  events: GameEvent[],
  playerId: string
): { canUndo: boolean; lastUndoableEventId?: string } {
  // Build set of undone event IDs
  const undoneEventIds = new Set<string>()
  for (const event of events) {
    if (event.undone) {
      undoneEventIds.add(event.id)
    }
    if (event.eventType === 'undo' && !event.undone) {
      undoneEventIds.add(event.payload.targetEventId)
    }
  }

  // Find the last event by the opponent that hasn't been undone
  const sortedEvents = [...events]
    .filter(e => !undoneEventIds.has(e.id) && e.eventType !== 'undo')
    .sort((a, b) => b.sequenceNumber - a.sequenceNumber)

  // Find player's last undoable event
  let lastOpponentEventSeq = -1
  for (const event of sortedEvents) {
    if (event.playerId !== playerId) {
      lastOpponentEventSeq = event.sequenceNumber
      break
    }
  }

  // Find player's most recent event after opponent's last event
  const playerEvents = sortedEvents.filter(
    e => e.playerId === playerId && e.sequenceNumber > lastOpponentEventSeq
  )

  const lastEvent = playerEvents[0]
  if (!lastEvent) {
    return { canUndo: false }
  }

  return {
    canUndo: true,
    lastUndoableEventId: lastEvent.id,
  }
}

/**
 * Calculate recommended handicap based on FARGO ratings
 * Note: This is a simplified calculation. The actual FARGO formula
 * for straight pool may need to be researched (TQ-1 in requirements)
 */
export function calculateRecommendedHandicap(
  rating1: number,
  rating2: number,
  targetScore: number
): { player1Handicap: number; player2Handicap: number } {
  // Simplified handicap calculation
  // Higher rated player gives points to lower rated player
  const ratingDiff = Math.abs(rating1 - rating2)

  // Rough formula: ~1 point per 5 rating points difference
  // This should be replaced with official FARGO formula if available
  const handicapPoints = Math.round(ratingDiff / 5)

  if (rating1 > rating2) {
    // Player 1 is stronger, player 2 gets handicap
    return {
      player1Handicap: 0,
      player2Handicap: Math.min(handicapPoints, targetScore - 1),
    }
  } else if (rating2 > rating1) {
    // Player 2 is stronger, player 1 gets handicap
    return {
      player1Handicap: Math.min(handicapPoints, targetScore - 1),
      player2Handicap: 0,
    }
  }

  // Equal ratings, no handicap
  return {
    player1Handicap: 0,
    player2Handicap: 0,
  }
}
