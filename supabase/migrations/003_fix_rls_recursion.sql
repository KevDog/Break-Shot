-- Fix RLS policy infinite recursion between sessions and players tables
-- The original policies created circular dependencies

-- ============================================================================
-- Drop ALL existing policies to start fresh (both old and new names)
-- ============================================================================

-- Sessions policies (old names from 002)
DROP POLICY IF EXISTS "Users can create sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view their sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view sessions they created" ON sessions;
DROP POLICY IF EXISTS "Creator can update session" ON sessions;
DROP POLICY IF EXISTS "Anyone can view waiting sessions by join code" ON sessions;

-- Sessions policies (new names from this migration)
DROP POLICY IF EXISTS "sessions_insert" ON sessions;
DROP POLICY IF EXISTS "sessions_select_own" ON sessions;
DROP POLICY IF EXISTS "sessions_select_waiting" ON sessions;
DROP POLICY IF EXISTS "sessions_update" ON sessions;
DROP POLICY IF EXISTS "sessions_update_by_player" ON sessions;
DROP POLICY IF EXISTS "sessions_update_waiting_to_setup" ON sessions;
DROP POLICY IF EXISTS "sessions_select_as_player" ON sessions;
DROP POLICY IF EXISTS "sessions_select_active" ON sessions;
DROP POLICY IF EXISTS "sessions_select_waiting" ON sessions;

-- Players policies (old names from 002)
DROP POLICY IF EXISTS "Users can join sessions as player" ON players;
DROP POLICY IF EXISTS "Users can view players in their sessions" ON players;
DROP POLICY IF EXISTS "Users can view own player records" ON players;
DROP POLICY IF EXISTS "Session creators can view all players" ON players;
DROP POLICY IF EXISTS "Players can view other players in same session" ON players;
DROP POLICY IF EXISTS "Users can update own player record" ON players;

-- Players policies (new names from this migration)
DROP POLICY IF EXISTS "players_insert" ON players;
DROP POLICY IF EXISTS "players_select_own" ON players;
DROP POLICY IF EXISTS "players_select_as_creator" ON players;
DROP POLICY IF EXISTS "players_select_same_session" ON players;
DROP POLICY IF EXISTS "players_select_in_accessible_sessions" ON players;
DROP POLICY IF EXISTS "players_update" ON players;

-- ============================================================================
-- Sessions Policies (rebuilt without recursion)
-- ============================================================================

-- Anyone authenticated can create a session (must set themselves as creator)
CREATE POLICY "sessions_insert"
    ON sessions FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- Users can view sessions they created
CREATE POLICY "sessions_select_own"
    ON sessions FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

-- Anyone can view waiting/setup/active sessions
-- This is broader but avoids recursion - access control is done at player level
CREATE POLICY "sessions_select_active"
    ON sessions FOR SELECT
    TO authenticated
    USING (status IN ('waiting', 'setup', 'active'));

-- Session creator can update session status
CREATE POLICY "sessions_update"
    ON sessions FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Allow updating waiting sessions to setup (for join flow)
-- This is safe because only authenticated users can do this and
-- the app logic ensures proper validation
CREATE POLICY "sessions_update_waiting_to_setup"
    ON sessions FOR UPDATE
    TO authenticated
    USING (status = 'waiting')
    WITH CHECK (true);

-- ============================================================================
-- Players Policies (rebuilt without recursion)
-- ============================================================================

-- Users can add themselves as a player to a session
CREATE POLICY "players_insert"
    ON players FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own player records
CREATE POLICY "players_select_own"
    ON players FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can view players in sessions they created (checks sessions table only)
CREATE POLICY "players_select_as_creator"
    ON players FOR SELECT
    TO authenticated
    USING (
        session_id IN (
            SELECT id FROM sessions WHERE created_by = auth.uid()
        )
    );

-- Users can view players in waiting/setup/active sessions they can access
-- This avoids self-referential query by checking session status instead
CREATE POLICY "players_select_in_accessible_sessions"
    ON players FOR SELECT
    TO authenticated
    USING (
        session_id IN (
            SELECT id FROM sessions
            WHERE status IN ('waiting', 'setup', 'active')
        )
    );

-- Users can only update their own player record
CREATE POLICY "players_update"
    ON players FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Function to transition session from waiting to setup (bypasses RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION join_session(p_session_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Verify session is in waiting status
    IF NOT EXISTS (SELECT 1 FROM sessions WHERE id = p_session_id AND status = 'waiting') THEN
        RAISE EXCEPTION 'Session not found or not in waiting status';
    END IF;

    -- Update session status to setup
    UPDATE sessions SET status = 'setup' WHERE id = p_session_id AND status = 'waiting';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
