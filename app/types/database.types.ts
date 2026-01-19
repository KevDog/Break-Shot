// Break Shot - Supabase Database Types
// This file will be regenerated from Supabase schema using:
// npx supabase gen types typescript --project-id <project-id> > app/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          join_code: string
          status: 'waiting' | 'setup' | 'active' | 'completed' | 'abandoned'
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          join_code: string
          status?: 'waiting' | 'setup' | 'active' | 'completed' | 'abandoned'
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          join_code?: string
          status?: 'waiting' | 'setup' | 'active' | 'completed' | 'abandoned'
          created_at?: string
          created_by?: string
        }
      }
      players: {
        Row: {
          id: string
          session_id: string
          user_id: string
          role: 'player1' | 'player2'
          name: string
          fargo_rating: number | null
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          role: 'player1' | 'player2'
          name?: string
          fargo_rating?: number | null
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          role?: 'player1' | 'player2'
          name?: string
          fargo_rating?: number | null
        }
      }
      games: {
        Row: {
          id: string
          session_id: string
          game_number: number
          target_score: number
          allow_negative_score: boolean
          first_break: 'player1' | 'player2'
          player1_handicap: number
          player2_handicap: number
          status: 'active' | 'completed' | 'abandoned'
          started_at: string
        }
        Insert: {
          id?: string
          session_id: string
          game_number?: number
          target_score?: number
          allow_negative_score?: boolean
          first_break?: 'player1' | 'player2'
          player1_handicap?: number
          player2_handicap?: number
          status?: 'active' | 'completed' | 'abandoned'
          started_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          game_number?: number
          target_score?: number
          allow_negative_score?: boolean
          first_break?: 'player1' | 'player2'
          player1_handicap?: number
          player2_handicap?: number
          status?: 'active' | 'completed' | 'abandoned'
          started_at?: string
        }
      }
      game_events: {
        Row: {
          id: string
          game_id: string
          player_id: string
          sequence_number: number
          event_type: 'balls_made' | 'foul' | 'foul_option' | 'safety' | 'end_turn' | 'rerack' | 'undo' | 'game_end'
          payload: Json
          timestamp: string
          undone: boolean
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          sequence_number?: number
          event_type: 'balls_made' | 'foul' | 'foul_option' | 'safety' | 'end_turn' | 'rerack' | 'undo' | 'game_end'
          payload?: Json
          timestamp?: string
          undone?: boolean
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          sequence_number?: number
          event_type?: 'balls_made' | 'foul' | 'foul_option' | 'safety' | 'end_turn' | 'rerack' | 'undo' | 'game_end'
          payload?: Json
          timestamp?: string
          undone?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      session_status: 'waiting' | 'setup' | 'active' | 'completed' | 'abandoned'
      game_status: 'active' | 'completed' | 'abandoned'
      player_role: 'player1' | 'player2'
      event_type: 'balls_made' | 'foul' | 'foul_option' | 'safety' | 'end_turn' | 'rerack' | 'undo' | 'game_end'
    }
  }
}
