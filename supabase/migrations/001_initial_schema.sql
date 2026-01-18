-- Break Shot Database Schema
-- Based on requirements Section 6: Information Architecture / Data Model

-- ============================================================================
-- Custom Types (Enums)
-- ============================================================================

CREATE TYPE session_status AS ENUM ('waiting', 'setup', 'active', 'completed', 'abandoned');
CREATE TYPE game_status AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE player_role AS ENUM ('player1', 'player2');
CREATE TYPE event_type AS ENUM ('balls_made', 'foul', 'safety', 'end_turn', 'rerack', 'undo', 'game_end');

-- ============================================================================
-- Sessions Table
-- ============================================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    join_code VARCHAR(50) NOT NULL UNIQUE,
    status session_status NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Index for join code lookups
    CONSTRAINT join_code_format CHECK (join_code ~ '^[a-z]+-[a-z]+-[0-9]{2}$')
);

CREATE INDEX idx_sessions_join_code ON sessions(join_code);
CREATE INDEX idx_sessions_status ON sessions(status) WHERE status IN ('waiting', 'setup', 'active');
CREATE INDEX idx_sessions_created_by ON sessions(created_by);

-- ============================================================================
-- Players Table
-- ============================================================================

CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role player_role NOT NULL,
    name VARCHAR(50) NOT NULL DEFAULT '',
    fargo_rating INTEGER CHECK (fargo_rating IS NULL OR (fargo_rating >= 0 AND fargo_rating <= 900)),

    -- Each user can only be one player per session
    CONSTRAINT unique_user_per_session UNIQUE (session_id, user_id),
    -- Each role can only be assigned once per session
    CONSTRAINT unique_role_per_session UNIQUE (session_id, role)
);

CREATE INDEX idx_players_session ON players(session_id);
CREATE INDEX idx_players_user ON players(user_id);

-- ============================================================================
-- Games Table
-- ============================================================================

CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    game_number INTEGER NOT NULL DEFAULT 1,
    target_score INTEGER NOT NULL DEFAULT 75 CHECK (target_score > 0 AND target_score <= 150),
    allow_negative_score BOOLEAN NOT NULL DEFAULT FALSE,
    first_break player_role NOT NULL DEFAULT 'player1',
    player1_handicap INTEGER NOT NULL DEFAULT 0 CHECK (player1_handicap >= 0),
    player2_handicap INTEGER NOT NULL DEFAULT 0 CHECK (player2_handicap >= 0),
    status game_status NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Only one player can have a handicap
    CONSTRAINT only_one_handicap CHECK (player1_handicap = 0 OR player2_handicap = 0),
    -- Game number must be unique within session
    CONSTRAINT unique_game_number UNIQUE (session_id, game_number)
);

CREATE INDEX idx_games_session ON games(session_id);
CREATE INDEX idx_games_status ON games(status) WHERE status = 'active';

-- ============================================================================
-- Game Events Table (Event Store - Source of Truth)
-- ============================================================================

CREATE TABLE game_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    event_type event_type NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    undone BOOLEAN NOT NULL DEFAULT FALSE,

    -- Sequence numbers must be unique and ordered within a game
    CONSTRAINT unique_sequence_per_game UNIQUE (game_id, sequence_number)
);

CREATE INDEX idx_game_events_game ON game_events(game_id);
CREATE INDEX idx_game_events_game_sequence ON game_events(game_id, sequence_number);
CREATE INDEX idx_game_events_player ON game_events(player_id);
CREATE INDEX idx_game_events_not_undone ON game_events(game_id) WHERE undone = FALSE;

-- ============================================================================
-- Functions
-- ============================================================================

-- Auto-increment sequence number for game events
CREATE OR REPLACE FUNCTION get_next_sequence_number(p_game_id UUID)
RETURNS INTEGER AS $$
DECLARE
    next_seq INTEGER;
BEGIN
    SELECT COALESCE(MAX(sequence_number), 0) + 1
    INTO next_seq
    FROM game_events
    WHERE game_id = p_game_id;

    RETURN next_seq;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set sequence number on insert
CREATE OR REPLACE FUNCTION set_sequence_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sequence_number IS NULL THEN
        NEW.sequence_number := get_next_sequence_number(NEW.game_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_sequence_number
    BEFORE INSERT ON game_events
    FOR EACH ROW
    EXECUTE FUNCTION set_sequence_number();

-- Function to clean up expired sessions (24 hours for unused sessions - TQ-5)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM sessions
        WHERE status = 'waiting'
        AND created_at < NOW() - INTERVAL '24 hours'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Enable Realtime
-- ============================================================================

-- Enable realtime for game_events table (for real-time sync between players)
ALTER PUBLICATION supabase_realtime ADD TABLE game_events;

-- Enable realtime for sessions (for connection status and session state)
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- Enable realtime for players (for opponent joining notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Enable realtime for games (for game state changes)
ALTER PUBLICATION supabase_realtime ADD TABLE games;
