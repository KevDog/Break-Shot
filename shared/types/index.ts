// Break Shot - Core Type Definitions
// Based on requirements Section 6: Information Architecture / Data Model

// ============================================================================
// Enums
// ============================================================================

export type SessionStatus = 'waiting' | 'setup' | 'active' | 'completed' | 'abandoned'

export type GameStatus = 'active' | 'completed' | 'abandoned'

export type PlayerRole = 'player1' | 'player2'

export type GameEventType =
  | 'balls_made'
  | 'foul'
  | 'foul_option'
  | 'safety'
  | 'end_turn'
  | 'rerack'
  | 'undo'
  | 'game_end'

export type FoulOptionChoice = 'accept_table' | 'force_rebreak'

export type GameEndReason = 'target_reached' | 'abandoned'

// ============================================================================
// Core Entities
// ============================================================================

export interface Session {
  id: string
  joinCode: string
  status: SessionStatus
  createdAt: string
  createdBy: string
}

export interface Player {
  id: string
  sessionId: string
  role: PlayerRole
  name: string
}

export interface Game {
  id: string
  sessionId: string
  gameNumber: number
  targetScore: number
  allowNegativeScore: boolean
  firstBreak: PlayerRole
  player1Handicap: number
  player2Handicap: number
  status: GameStatus
  startedAt: string
}

// ============================================================================
// Event Store (Source of Truth)
// ============================================================================

export interface GameEventBase {
  id: string
  gameId: string
  playerId: string
  sequenceNumber: number
  eventType: GameEventType
  timestamp: string
  undone: boolean
}

export interface BallsMadePayload {
  count: number
}

export interface UndoPayload {
  targetEventId: string
}

export interface GameEndPayload {
  reason: GameEndReason
  winnerId?: string
}

export interface FoulOptionPayload {
  choice: FoulOptionChoice
}

// Empty payloads for events that don't need additional data
export type EmptyPayload = Record<string, never>

export interface BallsMadeEvent extends GameEventBase {
  eventType: 'balls_made'
  payload: BallsMadePayload
}

export interface FoulEvent extends GameEventBase {
  eventType: 'foul'
  payload: EmptyPayload
}

export interface FoulOptionEvent extends GameEventBase {
  eventType: 'foul_option'
  payload: FoulOptionPayload
}

export interface SafetyEvent extends GameEventBase {
  eventType: 'safety'
  payload: EmptyPayload
}

export interface EndTurnEvent extends GameEventBase {
  eventType: 'end_turn'
  payload: EmptyPayload
}

export interface RerackEvent extends GameEventBase {
  eventType: 'rerack'
  payload: EmptyPayload
}

export interface UndoEvent extends GameEventBase {
  eventType: 'undo'
  payload: UndoPayload
}

export interface GameEndEvent extends GameEventBase {
  eventType: 'game_end'
  payload: GameEndPayload
}

export type GameEvent =
  | BallsMadeEvent
  | FoulEvent
  | FoulOptionEvent
  | SafetyEvent
  | EndTurnEvent
  | RerackEvent
  | UndoEvent
  | GameEndEvent

// ============================================================================
// Projections (Computed from Events)
// ============================================================================

export interface GameStateProjection {
  gameId: string
  currentTurn: PlayerRole
  currentInning: number
  rerackCount: number
  ballsInCurrentRack: number  // 0-14, tracks how many balls have been pocketed this rack
  needsRerack: boolean        // True when 14 balls have been pocketed, waiting for rerack
  awaitingFoulOption: boolean // True when awaiting incoming player's decision after opening break foul
  foulingPlayer?: PlayerRole  // The player who committed the foul (for rebreak scenario)
  status: GameStatus
  winnerId?: string
  endedAt?: string
}

export interface PlayerStateProjection {
  playerId: string
  gameId: string
  totalScore: number
  rackScore: number
  currentRun: number
  highRun: number
  consecutiveFouls: number
  totalFouls: number
}

// Combined game state for UI consumption
export interface FullGameState {
  game: Game
  gameState: GameStateProjection
  player1: Player
  player2: Player
  player1State: PlayerStateProjection
  player2State: PlayerStateProjection
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateSessionRequest {
  // No body needed - session created for authenticated user
}

export interface CreateSessionResponse {
  session: Session
  player: Player
}

export interface JoinSessionRequest {
  joinCode: string
}

export interface JoinSessionResponse {
  session: Session
  player: Player
}

export interface UpdatePlayerRequest {
  name: string
}

export interface GameSetupRequest {
  targetScore: number
  allowNegativeScore: boolean
  firstBreak: PlayerRole
  player1Handicap: number
  player2Handicap: number
}

export interface RecordEventRequest {
  eventType: Exclude<GameEventType, 'undo' | 'game_end'>
  payload?: BallsMadePayload
}

export interface UndoRequest {
  targetEventId: string
}

export interface EndGameRequest {
  reason: GameEndReason
}

// ============================================================================
// Realtime Subscription Types
// ============================================================================

export interface RealtimeEventPayload<T = Record<string, unknown>> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  old: T | null
  new: T | null
}

export type RealtimeGameEventPayload = RealtimeEventPayload<GameEvent>

// ============================================================================
// Connection Status
// ============================================================================

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting'

// ============================================================================
// Utility Types
// ============================================================================

export type CreateEventInput = Omit<GameEvent, 'id' | 'sequenceNumber' | 'timestamp' | 'undone'>
