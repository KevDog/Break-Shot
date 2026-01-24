# Break Shot - Claude Development Notes

## Project Overview
Break Shot is a 14.1 Straight Pool scoring application with real-time multiplayer, local multiplayer, and upcoming single-player modes.

## Completed Features
- **Online Multiplayer**: Real-time scoring with Supabase
- **Local Multiplayer**: Pass-and-play mode for two players on one device
  - Uses localStorage for offline play
  - Manual handicap system (only one player can have handicap)
  - No authentication required
  - Located at `/local/setup` and `/local/game`

## Single-Player Mode Requirements (To Be Implemented)

### Core Features
1. **Solo Practice Mode** - Practice pool without an opponent
2. **Target Score Tracking** - Set and track personal goals (50/100/150 points)
3. **Run Tracking** - Monitor individual runs and high runs
4. **Session Statistics** - Track balls per inning, average run length
5. **Practice Drills** - Optional structured practice scenarios

### Game Flow
1. **Start Options**:
   - Quick Start (default 150 points)
   - Custom Target Score
   - Time-based practice
   - Endless mode (no target, just track stats)

2. **During Play**:
   - Score balls made per turn
   - Track misses and fouls
   - Monitor current run
   - Display session stats in real-time
   - Rerack when needed (every 14 balls)
   - No turn switching (always player's turn)

3. **Session End**:
   - Show final statistics
   - Save high scores/runs locally
   - Compare to personal bests
   - Option to start new session

### UI/UX Differences from Multiplayer
1. **Simplified Interface**:
   - Single player card only
   - No turn switching UI
   - No opponent waiting states
   - Focus on personal metrics and progress

2. **Stats Dashboard**:
   - Current run display
   - Session high run
   - Balls per inning average
   - Total fouls
   - Time elapsed
   - Progress toward target

3. **Practice Features**:
   - "Beat Your Best" indicators
   - Running averages
   - Streak tracking

### Data Model Considerations
1. **Session Type**: Add `mode: 'practice'` to game modes
2. **No Player 2**: Single player only
3. **Statistics Storage**: Store practice sessions in localStorage
4. **History**: Keep last N practice sessions for progress tracking
5. **No Real-time Sync**: No Supabase needed, fully offline

### Implementation Strategy
1. **Reuse LocalGame Infrastructure**:
   - Extend `useLocalGame.ts` composable
   - Add `players: 1` configuration
   - Simplify game state (no turn management)

2. **New Routes**:
   - `/practice` - Practice mode home
   - `/practice/setup` - Configure practice session
   - `/practice/play` - Active practice session
   - `/practice/stats` - View statistics and history

3. **Components to Create**:
   - `PracticeStats.vue` - Statistics dashboard
   - `SessionHistory.vue` - Past sessions viewer
   - `PracticeDrills.vue` - Structured practice scenarios (future)

4. **Components to Adapt**:
   - Hide turn-based UI elements in GameControls
   - Simplify PlayerCard for single player
   - Add stats display to game view

### Technical Notes
- Build on existing `useLocalGame.ts` infrastructure
- Use same scoring engine from `shared/game/projection.ts`
- Store practice data separately from multiplayer games
- Consider adding export functionality for stats

### Future Enhancements (Phase 2)
1. **Practice Drills**:
   - Specific scenarios (e.g., "Make 5 balls in a row")
   - Challenge modes
   - Skill progression tracking

2. **Analytics**:
   - Charts and graphs of progress
   - Trends over time
   - Personal records board

3. **Cloud Sync** (optional):
   - Sync practice stats across devices
   - Share achievements
   - Global leaderboards

## Development Commands
```bash
# Start dev server
npm run dev

# Run type checking
npm run typecheck

# Run tests
npm run test

# Build for production
npm run build
```

## Key Files
- `/app/composables/useLocalGame.ts` - Local game state management
- `/shared/game/projection.ts` - Game scoring engine
- `/app/pages/local/` - Local multiplayer pages
- `/app/components/game/` - Reusable game components

## Next Steps
1. Implement single-player practice mode using requirements above
2. Add session statistics and history tracking
3. Create practice-specific UI components
4. Test offline functionality thoroughly