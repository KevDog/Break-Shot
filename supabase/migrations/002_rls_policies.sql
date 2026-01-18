-- Break Shot Row Level Security Policies
-- Based on requirements: Players can only update their own score (enforced server-side) - NF-9

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Sessions Policies
-- ============================================================================

-- Anyone authenticated can create a session
CREATE POLICY "Users can create sessions"
    ON sessions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Users can view sessions they created or are part of
CREATE POLICY "Users can view their sessions"
    ON sessions FOR SELECT
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM players
            WHERE players.session_id = sessions.id
            AND players.user_id = auth.uid()
        )
    );

-- Session creator can update session status
CREATE POLICY "Creator can update session"
    ON sessions FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Anyone can view waiting sessions (to join via code)
CREATE POLICY "Anyone can view waiting sessions by join code"
    ON sessions FOR SELECT
    TO authenticated
    USING (status = 'waiting');

-- ============================================================================
-- Players Policies
-- ============================================================================

-- Users can add themselves as a player to a session
CREATE POLICY "Users can join sessions as player"
    ON players FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can view players in sessions they're part of
CREATE POLICY "Users can view players in their sessions"
    ON players FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = players.session_id
            AND (
                sessions.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM players p2
                    WHERE p2.session_id = sessions.id
                    AND p2.user_id = auth.uid()
                )
            )
        )
    );

-- Users can only update their own player record
CREATE POLICY "Users can update own player record"
    ON players FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Games Policies
-- ============================================================================

-- Session creator (player1) can create games
CREATE POLICY "Session creator can create games"
    ON games FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = games.session_id
            AND sessions.created_by = auth.uid()
        )
    );

-- Players in session can view games
CREATE POLICY "Players can view games in their sessions"
    ON games FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM players
            WHERE players.session_id = games.session_id
            AND players.user_id = auth.uid()
        )
    );

-- Players in session can update game status
CREATE POLICY "Players can update games"
    ON games FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM players
            WHERE players.session_id = games.session_id
            AND players.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM players
            WHERE players.session_id = games.session_id
            AND players.user_id = auth.uid()
        )
    );

-- ============================================================================
-- Game Events Policies
-- ============================================================================

-- Players can only insert events for themselves
CREATE POLICY "Players can insert own events"
    ON game_events FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM players
            WHERE players.id = game_events.player_id
            AND players.user_id = auth.uid()
        )
    );

-- Players in the game can view all events
CREATE POLICY "Players can view game events"
    ON game_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM players
            JOIN games ON games.session_id = players.session_id
            WHERE games.id = game_events.game_id
            AND players.user_id = auth.uid()
        )
    );

-- Players can only update (undo) their own events
CREATE POLICY "Players can update own events"
    ON game_events FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM players
            WHERE players.id = game_events.player_id
            AND players.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM players
            WHERE players.id = game_events.player_id
            AND players.user_id = auth.uid()
        )
    );

-- ============================================================================
-- Service Role Bypass (for server-side operations)
-- ============================================================================

-- Note: The service role key bypasses RLS automatically.
-- Use it only for trusted server-side operations like:
-- - Session cleanup
-- - Admin operations
-- - Analytics aggregation
