/**
 * Unit tests for 14.1 Straight Pool projection logic
 * Based on scenarios documented in .claude/CLAUDE.md
 */

import { describe, it, expect } from 'vitest'
import { computeProjection, getDisplayScore } from './projection'
import type { Game, GameEvent } from '../types'

// Helper to create a base game
function createGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'game-1',
    sessionId: 'session-1',
    gameNumber: 1,
    targetScore: 100,
    allowNegativeScore: true,
    firstBreak: 'player1',
    player1Handicap: 0,
    player2Handicap: 0,
    status: 'active',
    startedAt: new Date().toISOString(),
    ...overrides,
  }
}

// Helper to create events with sequential numbers
let sequenceCounter = 0
function resetSequence() {
  sequenceCounter = 0
}

function createEvent(
  playerId: string,
  eventType: GameEvent['eventType'],
  payload: Record<string, unknown> = {}
): GameEvent {
  sequenceCounter++
  return {
    id: `event-${sequenceCounter}`,
    gameId: 'game-1',
    playerId,
    sequenceNumber: sequenceCounter,
    eventType,
    timestamp: new Date().toISOString(),
    undone: false,
    payload,
  } as GameEvent
}

const PLAYER1_ID = 'player-1-id'
const PLAYER2_ID = 'player-2-id'

describe('14.1 Straight Pool Projection - Basic Scenarios', () => {
  beforeEach(() => {
    resetSequence()
  })

  it('Scenario 1: Player misses first shot - switch to other player', () => {
    const game = createGame()
    const events: GameEvent[] = [
      createEvent(PLAYER1_ID, 'end_turn'),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Turn should switch to player2
    expect(result.gameState.currentTurn).toBe('player2')
    // No score changes
    expect(result.player1State.totalScore).toBe(0)
    expect(result.player1State.rackScore).toBe(0)
    expect(result.player2State.totalScore).toBe(0)
    expect(result.player2State.rackScore).toBe(0)
    // Balls remaining unchanged
    expect(result.gameState.ballsInCurrentRack).toBe(0)
  })

  it('Scenario 2: Player makes shots - increment rack count', () => {
    const game = createGame()
    const events: GameEvent[] = [
      createEvent(PLAYER1_ID, 'balls_made', { count: 3 }),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Rack score incremented, total unchanged
    expect(result.player1State.rackScore).toBe(3)
    expect(result.player1State.totalScore).toBe(0)
    // Balls in rack increased
    expect(result.gameState.ballsInCurrentRack).toBe(3)
    // Current run updated
    expect(result.player1State.currentRun).toBe(3)
    // Still player1's turn
    expect(result.gameState.currentTurn).toBe('player1')
  })

  it('Scenario 3: Player commits foul on first shot - deduct from total, switch player', () => {
    const game = createGame()
    // First make a ball to complete opening break, then foul
    const events: GameEvent[] = [
      createEvent(PLAYER1_ID, 'balls_made', { count: 1 }),
      createEvent(PLAYER1_ID, 'end_turn'),
      createEvent(PLAYER2_ID, 'foul'),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Player2 total decremented by 1
    expect(result.player2State.totalScore).toBe(-1)
    // Turn switches to player1
    expect(result.gameState.currentTurn).toBe('player1')
    // Consecutive fouls incremented
    expect(result.player2State.consecutiveFouls).toBe(1)
  })

  it('Scenario 4: Player makes shots then commits foul - rack keeps points, total decremented', () => {
    const game = createGame()
    const events: GameEvent[] = [
      createEvent(PLAYER1_ID, 'balls_made', { count: 3 }),
      createEvent(PLAYER1_ID, 'foul'),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Rack score keeps the 3 balls made before foul
    expect(result.player1State.rackScore).toBe(3)
    // Total decremented by 1 (regular foul - opening break completed by balls_made)
    expect(result.player1State.totalScore).toBe(-1)
    // Balls in rack still shows 3 (balls made before foul)
    expect(result.gameState.ballsInCurrentRack).toBe(3)
    // Turn switches to player2
    expect(result.gameState.currentTurn).toBe('player2')
  })

  it('Scenario 5: Player makes shots then hits safety - rack keeps points, switch player', () => {
    const game = createGame()
    const events: GameEvent[] = [
      createEvent(PLAYER1_ID, 'balls_made', { count: 3 }),
      createEvent(PLAYER1_ID, 'safety'),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Rack score keeps the 3 balls
    expect(result.player1State.rackScore).toBe(3)
    // Total unchanged
    expect(result.player1State.totalScore).toBe(0)
    // Turn switches
    expect(result.gameState.currentTurn).toBe('player2')
    // Consecutive fouls reset (safety is legal shot)
    expect(result.player1State.consecutiveFouls).toBe(0)
  })

  it('Scenario 6: 14 balls sunk - needs rerack flag set', () => {
    const game = createGame()
    const events: GameEvent[] = [
      createEvent(PLAYER1_ID, 'balls_made', { count: 10 }),
      createEvent(PLAYER1_ID, 'balls_made', { count: 4 }),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Needs rerack flag should be true
    expect(result.gameState.needsRerack).toBe(true)
    expect(result.gameState.ballsInCurrentRack).toBe(14)
    // Rack score accumulated
    expect(result.player1State.rackScore).toBe(14)
  })

  it('Scenario 7: Rerack - add rack to total, zero rack, reset balls', () => {
    const game = createGame()
    const events: GameEvent[] = [
      createEvent(PLAYER1_ID, 'balls_made', { count: 10 }),
      createEvent(PLAYER1_ID, 'balls_made', { count: 4 }),
      createEvent(PLAYER1_ID, 'rerack'),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Rack score added to total
    expect(result.player1State.totalScore).toBe(14)
    // Rack score reset
    expect(result.player1State.rackScore).toBe(0)
    // Balls reset
    expect(result.gameState.ballsInCurrentRack).toBe(0)
    expect(result.gameState.needsRerack).toBe(false)
    // Rerack count incremented
    expect(result.gameState.rerackCount).toBe(1)
    // Still player1's turn
    expect(result.gameState.currentTurn).toBe('player1')
  })
})

describe('14.1 Straight Pool Projection - Foul Scenarios', () => {
  beforeEach(() => {
    resetSequence()
  })

  it('Scenario F1: Consecutive fouls tracking - show warning at 2', () => {
    const game = createGame()
    const events: GameEvent[] = [
      // Complete opening break first
      createEvent(PLAYER1_ID, 'balls_made', { count: 1 }),
      createEvent(PLAYER1_ID, 'end_turn'),
      // Player2 fouls
      createEvent(PLAYER2_ID, 'foul'),
      // Player1 turn, misses
      createEvent(PLAYER1_ID, 'end_turn'),
      // Player2 fouls again
      createEvent(PLAYER2_ID, 'foul'),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Player2 should have 2 consecutive fouls
    expect(result.player2State.consecutiveFouls).toBe(2)
    expect(result.player2State.totalFouls).toBe(2)
    // Total should be -2 (two 1-point fouls)
    expect(result.player2State.totalScore).toBe(-2)
  })

  it('Scenario F2: Three consecutive fouls - 15 point penalty plus foul', () => {
    const game = createGame()
    const events: GameEvent[] = [
      // Complete opening break
      createEvent(PLAYER1_ID, 'balls_made', { count: 1 }),
      createEvent(PLAYER1_ID, 'end_turn'),
      // Player2 fouls 3 times
      createEvent(PLAYER2_ID, 'foul'),
      createEvent(PLAYER1_ID, 'end_turn'),
      createEvent(PLAYER2_ID, 'foul'),
      createEvent(PLAYER1_ID, 'end_turn'),
      createEvent(PLAYER2_ID, 'foul'), // 3rd foul
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Consecutive fouls reset to 0 after 3rd
    expect(result.player2State.consecutiveFouls).toBe(0)
    // Total: -1 -1 -1 -15 = -18
    expect(result.player2State.totalScore).toBe(-18)
    expect(result.player2State.totalFouls).toBe(3)
  })

  it('Scenario F3: Opening break foul - deduct 2 points, await foul option', () => {
    const game = createGame()
    const events: GameEvent[] = [
      createEvent(PLAYER1_ID, 'foul'), // Opening break foul
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Opening break foul = 2 points
    expect(result.player1State.totalScore).toBe(-2)
    // Awaiting foul option
    expect(result.gameState.awaitingFoulOption).toBe(true)
    expect(result.gameState.foulingPlayer).toBe('player1')
    // Turn not switched yet
    expect(result.gameState.currentTurn).toBe('player1')
  })

  it('Scenario F3b: Opening break foul - accept table', () => {
    const game = createGame()
    const events: GameEvent[] = [
      createEvent(PLAYER1_ID, 'foul'),
      createEvent(PLAYER2_ID, 'foul_option', { choice: 'accept_table' }),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Foul option resolved
    expect(result.gameState.awaitingFoulOption).toBe(false)
    // Turn switches to player2
    expect(result.gameState.currentTurn).toBe('player2')
  })

  it('Scenario F4: Force Rebreak - fouling player breaks again, rack resets', () => {
    const game = createGame()
    const events: GameEvent[] = [
      createEvent(PLAYER1_ID, 'foul'),
      createEvent(PLAYER2_ID, 'foul_option', { choice: 'force_rebreak' }),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Foul option resolved
    expect(result.gameState.awaitingFoulOption).toBe(false)
    // Turn stays with player1 (they must rebreak)
    expect(result.gameState.currentTurn).toBe('player1')
    // Balls reset
    expect(result.gameState.ballsInCurrentRack).toBe(0)
    // Penalty remains
    expect(result.player1State.totalScore).toBe(-2)
  })

  it('Scenario F5: Scratch after opening break - regular foul (1 point)', () => {
    const game = createGame()
    const events: GameEvent[] = [
      // Complete opening break
      createEvent(PLAYER1_ID, 'balls_made', { count: 1 }),
      createEvent(PLAYER1_ID, 'end_turn'),
      // Player2 scratches (foul)
      createEvent(PLAYER2_ID, 'foul'),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Regular foul = 1 point
    expect(result.player2State.totalScore).toBe(-1)
    // No foul option (not opening break)
    expect(result.gameState.awaitingFoulOption).toBe(false)
  })
})

describe('14.1 Straight Pool Projection - Other Scenarios', () => {
  beforeEach(() => {
    resetSequence()
  })

  it('Scenario O1: Undo - reverts last action', () => {
    const game = createGame()
    const ballsEvent = createEvent(PLAYER1_ID, 'balls_made', { count: 3 })
    const undoEvent = createEvent(PLAYER1_ID, 'undo', { targetEventId: ballsEvent.id })

    const events: GameEvent[] = [ballsEvent, undoEvent]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Balls made should be undone
    expect(result.player1State.rackScore).toBe(0)
    expect(result.gameState.ballsInCurrentRack).toBe(0)
  })

  it('Scenario O2: Win condition - total + rack reaches target', () => {
    const game = createGame({ targetScore: 10 })
    const events: GameEvent[] = [
      createEvent(PLAYER1_ID, 'balls_made', { count: 10 }),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Game should be completed
    expect(result.gameState.status).toBe('completed')
    expect(result.gameState.winnerId).toBe(PLAYER1_ID)
  })

  it('Scenario O3: Handicaps - players start with different totals', () => {
    const game = createGame({
      player1Handicap: 0,
      player2Handicap: 25,
    })
    const events: GameEvent[] = []

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    expect(result.player1State.totalScore).toBe(0)
    expect(result.player2State.totalScore).toBe(25)
  })

  it('Legal shot resets consecutive fouls', () => {
    const game = createGame()
    const events: GameEvent[] = [
      // Complete opening break
      createEvent(PLAYER1_ID, 'balls_made', { count: 1 }),
      createEvent(PLAYER1_ID, 'end_turn'),
      // Player2 fouls
      createEvent(PLAYER2_ID, 'foul'),
      // Player1 misses
      createEvent(PLAYER1_ID, 'end_turn'),
      // Player2 makes a ball (legal shot)
      createEvent(PLAYER2_ID, 'balls_made', { count: 1 }),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Consecutive fouls reset by legal shot
    expect(result.player2State.consecutiveFouls).toBe(0)
  })

  it('High run tracking', () => {
    const game = createGame()
    const events: GameEvent[] = [
      createEvent(PLAYER1_ID, 'balls_made', { count: 5 }),
      createEvent(PLAYER1_ID, 'end_turn'),
      createEvent(PLAYER2_ID, 'end_turn'),
      createEvent(PLAYER1_ID, 'balls_made', { count: 3 }),
      createEvent(PLAYER1_ID, 'end_turn'),
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // High run should be 5 (from first inning)
    expect(result.player1State.highRun).toBe(5)
  })

  it('Inning increments when player2 ends turn', () => {
    const game = createGame()
    const events: GameEvent[] = [
      createEvent(PLAYER1_ID, 'end_turn'),
      createEvent(PLAYER2_ID, 'end_turn'), // End of inning 1
      createEvent(PLAYER1_ID, 'end_turn'),
      createEvent(PLAYER2_ID, 'end_turn'), // End of inning 2
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    expect(result.gameState.currentInning).toBe(3)
  })
})

describe('getDisplayScore', () => {
  it('returns totalScore + rackScore', () => {
    const state = {
      playerId: 'p1',
      gameId: 'g1',
      totalScore: 50,
      rackScore: 7,
      currentRun: 7,
      highRun: 10,
      consecutiveFouls: 0,
      totalFouls: 0,
    }

    expect(getDisplayScore(state)).toBe(57)
  })
})

describe('Edge cases', () => {
  beforeEach(() => {
    resetSequence()
  })

  it('handles payload.count as string (from JSON)', () => {
    const game = createGame()
    // Simulate payload where count is a string (could happen if JSON parsing is inconsistent)
    const events: GameEvent[] = [
      {
        id: 'event-1',
        gameId: 'game-1',
        playerId: PLAYER1_ID,
        sequenceNumber: 1,
        eventType: 'balls_made',
        timestamp: new Date().toISOString(),
        undone: false,
        payload: { count: '3' as unknown as number }, // String instead of number
      } as GameEvent,
    ]

    const result = computeProjection({
      game,
      events,
      player1Id: PLAYER1_ID,
      player2Id: PLAYER2_ID,
    })

    // Should still work correctly with Number() coercion
    expect(result.player1State.rackScore).toBe(3)
    expect(result.gameState.ballsInCurrentRack).toBe(3)
  })
})
