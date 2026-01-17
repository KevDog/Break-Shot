# Break Shot - Requirements Document

## 14.1 Straight Pool Scoring Application

**Version:** 1.0 Draft  
**Last Updated:** January 17, 2026  
**Status:** Ready for Implementation

-----

## Table of Contents

1. [Project Overview & Goals](#section-1-project-overview--goals)
2. [Tech Stack](#section-2-tech-stack)
3. [User Personas & Use Cases](#section-3-user-personas--use-cases)
4. [Functional Requirements](#section-4-functional-requirements)
5. [Non-Functional Requirements](#section-5-non-functional-requirements)
6. [Information Architecture / Data Model](#section-6-information-architecture--data-model)
7. [UI/UX Considerations](#section-7-uiux-considerations)
8. [Out of Scope for V1](#section-8-out-of-scope-for-v1)
9. [Open Questions](#section-9-open-questions)

-----

## Section 1: Project Overview & Goals

### Purpose

A web application for scoring 14.1 continuous (straight pool) matches, designed for use at the table during play.

### Goals

1. Accurate, intuitive scoring for 14.1 straight pool with full rules support
2. Offline-capable for use in pool halls with unreliable connectivity
3. Mobile-first interface optimized for quick input during play
4. Real-time sync so both players can view and update the score from their own devices
5. Authentication-ready for future user accounts and saved game history
6. Architecture supports future data persistence without major refactoring
7. Serve as a reusable starter template for similar applications (other cue sports, other domains with shared sessions)

### Non-Goals for V1

- Persistent game history (beyond active session)
- Statistics and analytics
- User profiles

### Starter Template Considerations

- Clean separation between game logic and UI components
- Session concept abstracted (not hard-coded to “pool match”)
- Auth integration points defined but swappable
- State management pattern supports real-time multi-user sessions
- Event-sourced model enables future projections without schema changes

### Scoring & Action Permissions

- Players can only update their own score (balls made, fouls)
- Either player can trigger shared game actions (rerack, end game)
- Both players see full game state in real-time
- Undo scoped to your own actions only

-----

## Section 2: Tech Stack

### Core Framework

|Component           |Technology                     |Notes                     |
|--------------------|-------------------------------|--------------------------|
|**Frontend/Backend**|Nuxt 3 with Nitro server routes|Full-stack TypeScript     |
|**Language**        |TypeScript                     |Throughout entire codebase|
|**Deployment**      |Vercel                         |Native Nuxt/Nitro support |

### Backend Services

|Service           |Technology           |Purpose                                        |
|------------------|---------------------|-----------------------------------------------|
|**Authentication**|Supabase Auth        |Required sign-up; supports future user features|
|**Real-time Sync**|Supabase Realtime    |WebSocket-based game state synchronization     |
|**Database**      |Supabase (PostgreSQL)|Event store; persistence-ready architecture    |

### Client Features

|Feature             |Technology           |Notes                                 |
|--------------------|---------------------|--------------------------------------|
|**PWA**             |Nuxt PWA module      |Offline support, installable          |
|**State Management**|Vue 3 Composition API|Reactive projections from event stream|

### Analytics & Observability

|Service            |Technology         |Notes                 |
|-------------------|-------------------|----------------------|
|**Usage Analytics**|Vercel Analytics   |Anonymous, no PII     |
|**Error Tracking** |Sentry             |Client and server-side|
|**Logging**        |Vercel/Nitro native|Server-side debugging |

### Compliance

|Requirement|Approach                                            |
|-----------|----------------------------------------------------|
|**Privacy**|No PII in analytics                                 |
|**GDPR**   |Cookie consent, data retention policies, user rights|

-----

## Section 3: User Personas & Use Cases

### Persona 1: Game Creator (Player 1)

**Description:** A straight pool player who initiates a match. They set up game parameters and share access with their opponent.

**Use Cases:**

1. Create a new game session
2. Share word-based join code with opponent
3. Enter their own name during setup
4. Optionally enter their own FARGO rating
5. View recommended handicap if both ratings provided
6. Set target score (default 75, max 150)
7. Set optional handicap for one player
8. Set negative score option (default: floor at zero)
9. Select who breaks (Player 1 or Player 2)
10. Confirm setup to start the match
11. Record balls made during their own innings
12. Record fouls on their own turn
13. Trigger rerack when appropriate
14. Initiate end game (requires opponent confirmation)
15. Undo their own actions (back to opponent’s last action)

### Persona 2: Game Joiner (Player 2)

**Description:** A straight pool player who joins an existing match created by their opponent.

**Use Cases:**

1. Join a game session via word-based code
2. Enter their own name during setup
3. Optionally enter their own FARGO rating
4. View setup options (read-only)
5. Record balls made during their own innings
6. Record fouls on their own turn
7. Trigger rerack when appropriate
8. Initiate end game (requires opponent confirmation)
9. Undo their own actions (back to opponent’s last action)

### Shared Use Cases (Both Personas)

- View real-time score, inning count, high run, foul count
- See whose turn it is
- Use the app offline (with sync when reconnected)
- Submit in-app feedback

### Handicap Rules

- Only one player can receive a handicap per game
- Handicap reflected in starting score with no separate display
- High run tracking always starts from zero (unaffected by handicap)
- If both players provide FARGO ratings, app recommends a handicap (official formula if available)
- Game creator makes final handicap decision

### FARGO Rating Integration

- Optional manual entry of FARGO rating for each player during game setup
- No validation or lookup—trust the player
- If both players enter ratings, calculate and display recommended handicap
- Game creator can accept, modify, or ignore the recommendation

-----

## Section 4: Functional Requirements

### 4.0 Game Initiation

|ID  |Requirement                                                           |
|----|----------------------------------------------------------------------|
|GI-1|Game creator creates a new session                                    |
|GI-2|System generates a unique word-based join code (e.g., “blue-tiger-42”)|
|GI-3|Creator sees waiting state with shareable code                        |
|GI-4|Joiner enters code to connect                                         |
|GI-5|When joiner connects, both players move to game setup phase           |

### 4.1 Game Setup

|ID  |Requirement                                                                                      |
|----|-------------------------------------------------------------------------------------------------|
|GS-1|Both players enter their own name                                                                |
|GS-2|Both players optionally enter their own FARGO rating                                             |
|GS-3|Game creator sets target score (default: 75, max: 150)                                           |
|GS-4|If both ratings provided, display recommended handicap                                           |
|GS-5|Game creator optionally sets handicap for one player                                             |
|GS-6|Game creator selects who breaks (Player 1 or Player 2)                                           |
|GS-7|Joiner can view setup options but cannot modify them                                             |
|GS-8|Game creator confirms setup to start the match                                                   |
|GS-9|Game creator sets negative score option (allow negative or floor at zero; default: floor at zero)|

### 4.2 Scoring

|ID   |Requirement                                                                              |
|-----|-----------------------------------------------------------------------------------------|
|SC-1 |Active player records balls made using increment/decrement buttons                       |
|SC-2 |Player’s score updates in real-time for both players                                     |
|SC-3 |Current run (balls made this inning) tracked and displayed                               |
|SC-4 |High run tracked per player (highest single inning)                                      |
|SC-5 |Inning ends when player records a miss (zero balls), foul, safety, or explicit “End turn”|
|SC-6 |“Safety” button ends inning and passes turn to opponent                                  |
|SC-7 |Turn auto-advances to opponent when inning ends                                          |
|SC-8 |Inning count increments when both players have completed a turn                          |
|SC-9 |Game ends when a player’s score reaches or exceeds target score                          |
|SC-10|Final score displays exact count (not capped at target)                                  |
|SC-11|Balls pocketed on a called safety are not scored; safety ends inning only                |

**Rack-Based Scoring Model:**

- Scoring within a rack uses increment/decrement on a **rack score** (per player)
- At rerack, each player’s rack score is added to their **total score**, then rack score resets to zero
- This model simplifies undo within a rack and aligns with natural gameplay flow
- Display shows both current rack score and cumulative total

### 4.3 Fouls

|ID  |Requirement                                                                      |
|----|---------------------------------------------------------------------------------|
|FO-1|Player can record a foul on their own turn                                       |
|FO-2|Foul deducts 1 point from player’s score                                         |
|FO-3|Foul ends the current inning                                                     |
|FO-4|Consecutive foul count tracked per player                                        |
|FO-5|Three consecutive fouls deducts an additional 15 points (total 16 for third foul)|
|FO-6|Consecutive foul count resets when player completes a legal shot                 |
|FO-7|Foul count for the game displayed per player                                     |
|FO-8|App alerts player when they reach two consecutive fouls                          |
|FO-9|If negative scores disabled, score floors at zero                                |

### 4.4 Rerack

|ID  |Requirement                                                  |
|----|-------------------------------------------------------------|
|RR-1|Either player can trigger a rerack                           |
|RR-2|Rerack count tracked and displayed                           |
|RR-3|Rerack does not affect score or turn                         |
|RR-4|No validation on when rerack can be triggered (trust players)|

### 4.5 Undo

|ID  |Requirement                                                         |
|----|--------------------------------------------------------------------|
|UN-1|Player can undo their own actions                                   |
|UN-2|Multiple undo levels supported                                      |
|UN-3|Undo restores previous game state (score, run, foul count, turn)    |
|UN-4|Undo available back to the point where opponent last input an action|
|UN-5|Players cannot undo opponent’s actions                              |

### 4.6 Game End

|ID  |Requirement                                                                                                           |
|----|----------------------------------------------------------------------------------------------------------------------|
|GE-1|Game ends automatically when a player’s score reaches or exceeds target                                               |
|GE-2|Either player can initiate “End Game”                                                                                 |
|GE-3|“End Game” requires confirmation from both players                                                                    |
|GE-4|Final screen displays stats: winner (if applicable), final scores, high runs, total innings, rerack count, foul counts|
|GE-5|“Rematch” option starts new game with adjustable settings (swap break, change target, etc.)                           |
|GE-6|“End Session” closes the session for both players                                                                     |

### 4.7 Real-Time Sync

|ID  |Requirement                                                                        |
|----|-----------------------------------------------------------------------------------|
|RT-1|All game state changes sync to both players in real-time via Supabase Realtime     |
|RT-2|Connection status indicator shown to each player                                   |
|RT-3|If connection lost, app queues actions locally                                     |
|RT-4|On reconnection, local actions sync and game state reconciles                      |
|RT-5|Conflict resolution: server state wins, with notification to affected player       |
|RT-6|If one player disconnects, other player can continue (actions sync on reconnection)|

### 4.8 Offline Support

|ID  |Requirement                                   |
|----|----------------------------------------------|
|OF-1|App installable as PWA                        |
|OF-2|Core UI loads and functions offline           |
|OF-3|Actions taken offline are queued locally      |
|OF-4|Queued actions sync when connectivity restored|
|OF-5|Clear visual indicator when app is offline    |

-----

## Section 5: Non-Functional Requirements

### 5.1 Performance

|ID  |Requirement                                                             |
|----|------------------------------------------------------------------------|
|NF-1|Real-time updates delivered within 500ms under normal network conditions|
|NF-2|UI interactions (button taps, score updates) respond within 100ms       |
|NF-3|Initial app load under 3 seconds on 4G connection                       |
|NF-4|PWA cached assets load instantly on repeat visits                       |

### 5.2 Reliability

|ID  |Requirement                                                             |
|----|------------------------------------------------------------------------|
|NF-5|No data loss during connectivity interruptions                          |
|NF-6|Graceful degradation when offline (core scoring functions remain usable)|
|NF-7|Session state recoverable if browser/app closes unexpectedly            |

### 5.3 Security

|ID   |Requirement                                                   |
|-----|--------------------------------------------------------------|
|NF-8 |All traffic over HTTPS                                        |
|NF-9 |Players can only modify their own score (enforced server-side)|
|NF-10|Session codes sufficiently random to prevent guessing         |
|NF-11|Auth tokens stored securely (Supabase Auth best practices)    |

### 5.4 Usability

|ID   |Requirement                                                           |
|-----|----------------------------------------------------------------------|
|NF-12|Mobile-first responsive design                                        |
|NF-13|Touch targets minimum 44x44px for easy tapping                        |
|NF-14|High contrast, readable in varied lighting (bright pool hall, dim bar)|
|NF-15|Minimal taps to record common actions (balls made, foul, safety)      |
|NF-16|No tutorial required for basic scoring flow                           |

### 5.5 Accessibility

|ID   |Requirement                          |
|-----|-------------------------------------|
|NF-17|WCAG 2.1 AA compliance target        |
|NF-18|Screen reader compatible             |
|NF-19|Supports system font size preferences|

### 5.6 Maintainability

|ID   |Requirement                                                                |
|-----|---------------------------------------------------------------------------|
|NF-20|Game logic separated from UI components (enables reuse for other games)    |
|NF-21|TypeScript throughout for type safety                                      |
|NF-22|Component-based architecture                                               |
|NF-23|Clear separation between session management, game rules, and real-time sync|

### 5.7 Compatibility

|ID   |Requirement                                                                        |
|-----|-----------------------------------------------------------------------------------|
|NF-24|Support modern evergreen browsers (Chrome, Safari, Firefox, Edge—latest 2 versions)|
|NF-25|iOS Safari and Android Chrome primary mobile targets                               |
|NF-26|No IE11 or legacy browser support                                                  |

### 5.8 Internationalization

|ID   |Requirement                                                        |
|-----|-------------------------------------------------------------------|
|NF-27|All user-facing strings externalized for translation               |
|NF-28|Architecture supports future localization (i18n framework in place)|
|NF-29|V1 ships English only                                              |

### 5.9 Analytics & Observability

|ID   |Requirement                                                                   |
|-----|------------------------------------------------------------------------------|
|NF-30|Anonymous usage analytics via Vercel Analytics                                |
|NF-31|Error tracking via Sentry (client and server)                                 |
|NF-32|API/server-side logging for debugging                                         |
|NF-33|Real-time sync health monitoring (connection failures, latency)               |
|NF-34|No PII collected in analytics                                                 |
|NF-35|GDPR-compliant: cookie consent, data retention policies, user rights supported|

-----

## Section 6: Information Architecture / Data Model

### Architecture: Event Sourcing

The application uses an event-sourced model where `GameEvent` is the source of truth. Game state is computed (projected) from the event stream. This enables:

- Trivial undo (replay events minus undone ones)
- Complete audit trail
- Natural unit of real-time synchronization
- Future projections (stats, replay) without schema changes

### 6.1 Core Entities

#### Session

|Field    |Type            |Description                                           |
|---------|----------------|------------------------------------------------------|
|id       |string (UUID)   |Unique session identifier                             |
|joinCode |string          |Word-based code for joining (e.g., “blue-tiger-42”)   |
|status   |enum            |`waiting`, `setup`, `active`, `completed`, `abandoned`|
|createdAt|timestamp       |When session was created                              |
|createdBy|string (user ID)|Player who created the session                        |

#### Player

|Field      |Type         |Description                                 |
|-----------|-------------|--------------------------------------------|
|id         |string (UUID)|Unique player identifier (maps to auth user)|
|sessionId  |string (UUID)|Session they belong to                      |
|role       |enum         |`player1`, `player2`                        |
|name       |string       |Display name                                |
|fargoRating|integer      |Optional FARGO rating                       |

#### Game

|Field             |Type         |Description                                          |
|------------------|-------------|-----------------------------------------------------|
|id                |string (UUID)|Unique game identifier                               |
|sessionId         |string (UUID)|Parent session                                       |
|gameNumber        |integer      |Sequential game number within session (for rematches)|
|targetScore       |integer      |Points needed to win (default 75, max 150)           |
|allowNegativeScore|boolean      |Whether scores can go below zero (default false)     |
|firstBreak        |enum         |`player1`, `player2`                                 |
|player1Handicap   |integer      |Starting score for player 1 (default 0)              |
|player2Handicap   |integer      |Starting score for player 2 (default 0)              |
|status            |enum         |`active`, `completed`, `abandoned`                   |
|startedAt         |timestamp    |When game started                                    |

### 6.2 Event Store (Source of Truth)

#### GameEvent

|Field         |Type         |Description                                     |
|--------------|-------------|------------------------------------------------|
|id            |string (UUID)|Unique event identifier                         |
|gameId        |string (UUID)|Parent game                                     |
|playerId      |string (UUID)|Player who triggered event                      |
|sequenceNumber|integer      |Ordering within game (monotonically increasing) |
|eventType     |enum         |See event types below                           |
|payload       |jsonb        |Event-specific data                             |
|timestamp     |timestamp    |When event occurred                             |
|undone        |boolean      |Whether this event has been undone (soft delete)|

#### Event Types & Payloads

|Event Type  |Payload                                                      |Description                        |
|------------|-------------------------------------------------------------|-----------------------------------|
|`balls_made`|`{ count: integer }`                                         |Player pocketed balls (1–14)       |
|`foul`      |`{}`                                                         |Player committed a foul            |
|`safety`    |`{}`                                                         |Player played a safety             |
|`end_turn`  |`{}`                                                         |Player explicitly ended turn (miss)|
|`rerack`    |`{}`                                                         |Balls reracked (14 + 1 formation)  |
|`undo`      |`{ targetEventId: UUID }`                                    |Undo a previous event              |
|`game_end`  |`{ reason: 'target_reached' | 'abandoned', winnerId?: UUID }`|Game concluded                     |

### 6.3 Projections (Computed from Events)

#### GameStateProjection (in-memory)

|Field        |Type         |Description                       |
|-------------|-------------|----------------------------------|
|gameId       |string (UUID)|Game reference                    |
|currentTurn  |enum         |`player1`, `player2`              |
|currentInning|integer      |Current inning number             |
|rerackCount  |integer      |Total reracks this game           |
|status       |enum         |`active`, `completed`, `abandoned`|
|winnerId     |string (UUID)|Player who won (if completed)     |
|endedAt      |timestamp    |When game ended (if completed)    |

#### PlayerStateProjection (in-memory, per player per game)

|Field           |Type         |Description                                                    |
|----------------|-------------|---------------------------------------------------------------|
|playerId        |string (UUID)|Player reference                                               |
|gameId          |string (UUID)|Game reference                                                 |
|totalScore      |integer      |Cumulative score across all completed racks (includes handicap)|
|rackScore       |integer      |Score within current rack (resets to zero at rerack)           |
|currentRun      |integer      |Balls made in current inning                                   |
|highRun         |integer      |Highest run this game                                          |
|consecutiveFouls|integer      |Current consecutive foul count                                 |
|totalFouls      |integer      |Total fouls this game                                          |

**Note:** Display score = totalScore + rackScore

### 6.4 Projection Logic

```
On event replay:
  1. Initialize state from game config (handicaps as totalScore, rackScore = 0, first break)
  2. For each event (ordered by sequenceNumber), excluding undone events:
     - balls_made: add to rackScore, add to currentRun, update highRun if exceeded
     - foul: subtract 1 from rackScore, increment consecutiveFouls, increment totalFouls
             if consecutiveFouls == 3: subtract 15 more, reset consecutiveFouls
             end turn
     - safety: end turn (no score change, no points for any balls pocketed)
     - end_turn: reset currentRun, switch turn, increment inning if player2 ended
     - rerack: add rackScore to totalScore, reset rackScore to 0, increment rerackCount
     - undo: mark target event as undone, recompute from beginning
     - game_end: set status, winnerId, endedAt
  3. Apply floor of zero if allowNegativeScore is false (applies to totalScore + rackScore)
  4. Display score = totalScore + rackScore
```

### 6.5 Relationships

```
Session (1) ──── (n) Game
Session (1) ──── (2) Player
Game (1) ──── (n) GameEvent
Player (1) ──── (n) GameEvent
```

### 6.6 Future Projection Examples (Out of Scope for V1)

|Projection         |Purpose                                           |
|-------------------|--------------------------------------------------|
|PlayerLifetimeStats|High run, win rate, average score across all games|
|GameReplay         |Step-through playback of a completed game         |
|SessionSummary     |Multi-game session stats for rematches            |

-----

## Section 7: UI/UX Considerations

### 7.1 Design Principles

|Principle            |Description                                                    |
|---------------------|---------------------------------------------------------------|
|**Speed first**      |Minimal taps to record common actions; no friction during play |
|**Glanceable**       |Scores and game state visible at a glance from arm’s length    |
|**Forgiving**        |Easy undo; confirmation for destructive actions                |
|**Ambient awareness**|Clear indicators for turn, connection status, opponent activity|
|**Works anywhere**   |Readable in bright pool halls and dim bars                     |

### 7.2 Screen Flow

```
[Landing] 
    ↓
[Create Session] → [Waiting for Opponent] → [Game Setup] → [Active Game] → [Game End]
    ↓                                              ↑              ↓            ↓
[Join Session] ─────────────────────────────────────┘         [Rematch] ──────┘
                                                                   ↓
                                                              [End Session]
```

### 7.3 Screen Inventory

|Screen         |Purpose                                               |
|---------------|------------------------------------------------------|
|**Landing**    |Create or join a session                              |
|**Waiting**    |Display join code, wait for opponent                  |
|**Game Setup** |Both players enter names/ratings; creator sets options|
|**Active Game**|Main scoring interface                                |
|**Game End**   |Stats summary, rematch/end session options            |

### 7.4 Active Game Screen (Primary Interface)

**Layout concept (mobile portrait):**

```
┌─────────────────────────────┐
│  Opponent Name        Score │  ← Opponent area (smaller)
│  Run: X  High: X  Fouls: X  │
├─────────────────────────────┤
│                             │
│  Your Name            Score │  ← Your area (larger, prominent)
│  Run: X  High: X  Fouls: X  │
│                             │
│      [ − ]  00  [ + ]       │  ← Increment/decrement balls made
│                             │
├─────────────────────────────┤
│ [Foul]  [Safety]  [End Turn]│  ← Action buttons
├─────────────────────────────┤
│ [Undo]           [Rerack]   │  ← Secondary actions
├─────────────────────────────┤
│ Inning: X    Racks: X    🟢 │  ← Game info + connection status
└─────────────────────────────┘
```

**Key UI elements:**

|Element                     |Behavior                                                          |
|----------------------------|------------------------------------------------------------------|
|**Score display**           |Large, high-contrast numbers; your score emphasized               |
|**Balls made counter**      |Increment/decrement buttons with current count; auto-adds to score|
|**Turn indicator**          |Clear visual distinction when it’s your turn vs opponent’s        |
|**Action buttons**          |Large touch targets (minimum 44x44px); disabled when not your turn|
|**Undo**                    |Available when you have actions to undo                           |
|**Connection status**       |Subtle indicator; prominent only when offline/reconnecting        |
|**Consecutive foul warning**|Visual alert when at 2 consecutive fouls                          |

### 7.5 Interaction Patterns

|Action               |Interaction                                                            |
|---------------------|-----------------------------------------------------------------------|
|**Record balls made**|Tap +/− to adjust count, then End Turn (or auto-advance on Foul/Safety)|
|**Quick miss**       |Tap End Turn with count at 0                                           |
|**Foul**             |Tap Foul; ends turn, applies penalty, auto-advances                    |
|**Safety**           |Tap Safety; ends turn, no score change, auto-advances                  |
|**Rerack**           |Tap Rerack; doesn’t affect turn or score                               |
|**Undo**             |Tap Undo; reverts last action; repeatable until opponent’s last action |

### 7.6 Visual Design Considerations

|Consideration    |Approach                                                            |
|-----------------|--------------------------------------------------------------------|
|**Theme**        |Dark mode only                                                      |
|**Contrast**     |High contrast text (WCAG AAA for scores)                            |
|**Typography**   |Large, bold score numbers; clear hierarchy                          |
|**Color usage**  |Minimal; reserve color for turn indicator, alerts, connection status|
|**Touch targets**|Generous sizing; spacing to prevent mis-taps                        |
|**Orientation**  |Portrait primary; landscape optional                                |

### 7.7 Notifications & Alerts

|Trigger                   |Notification                                            |
|--------------------------|--------------------------------------------------------|
|Opponent joins session    |Toast: “Opponent connected”                             |
|Two consecutive fouls     |Inline warning: “Warning: 2 consecutive fouls”          |
|Three-foul penalty        |Alert: “3 fouls—15 point penalty applied”               |
|Connection lost           |Status bar: “Offline—actions will sync when reconnected”|
|Reconnected               |Toast: “Back online”                                    |
|Opponent requests End Game|Modal: “Opponent wants to end the game. Confirm?”       |
|Game won                  |Modal: “You win!” / “Opponent wins” with stats          |

### 7.8 Feedback & Accessibility

|Feature            |Default|Description                                                             |
|-------------------|-------|------------------------------------------------------------------------|
|**Haptic feedback**|On     |Vibration confirms actions; distinct patterns for different action types|
|**Sound feedback** |Off    |Subtle audio cues for actions and state changes                         |
|**Settings toggle**|—      |Easy access to enable/disable both independently                        |

**Haptic patterns:**

|Action                  |Pattern            |
|------------------------|-------------------|
|Balls made (+/−)        |Light tap          |
|Foul                    |Double pulse       |
|Safety / End turn       |Single medium pulse|
|Undo                    |Short buzz         |
|Consecutive foul warning|Strong pulse       |
|Game won/lost           |Long pulse         |

**Sound cues (when enabled):**

|Event                   |Sound                   |
|------------------------|------------------------|
|Your turn               |Subtle chime            |
|Foul recorded           |Low tone                |
|Consecutive foul warning|Alert tone              |
|Opponent action synced  |Soft tick               |
|Game end                |Distinct completion tone|

### 7.9 Opponent Activity

|Indicator            |Description                                         |
|---------------------|----------------------------------------------------|
|**Active**           |Subtle indicator when opponent has app in foreground|
|**Idle/Backgrounded**|No indicator (absence of active)                    |
|**Disconnected**     |Visual change on opponent’s area (dimmed or icon)   |

-----

## Section 8: Out of Scope for V1

### 8.1 Data Persistence & History

|Item                             |Notes                                     |
|---------------------------------|------------------------------------------|
|Persistent game history          |Architecture supports it; storage deferred|
|Game replay                      |Event-sourced model enables this later    |
|Player lifetime statistics       |Future projection on event store          |
|Session history / rematch records|Track across sessions                     |

### 8.2 User Features

|Item                       |Notes                                   |
|---------------------------|----------------------------------------|
|User profiles              |Auth in place, but no profile management|
|Friend lists               |No social features                      |
|Player search / matchmaking|Sessions are code-based only            |
|Leaderboards               |Requires persistent stats               |

### 8.3 Advanced Gameplay

|Item                          |Notes                                    |
|------------------------------|-----------------------------------------|
|Spectator mode                |View-only access to live games           |
|Referee/scorekeeper role      |Non-player who can update either score   |
|Tournament/league support     |Multi-game brackets, standings           |
|Ball-by-ball tracking         |Track which balls pocketed (beyond count)|
|Rerack validation             |Enforce 14+1 rule automatically          |
|Opening break rule enforcement|Prompt for legal/illegal opening break   |

### 8.4 Multi-Platform

|Item                    |Notes                                         |
|------------------------|----------------------------------------------|
|Native iOS app          |PWA covers mobile for V1                      |
|Native Android app      |PWA covers mobile for V1                      |
|Desktop-optimized layout|Mobile-first; desktop usable but not optimized|

### 8.5 Integrations

|Item                   |Notes                             |
|-----------------------|----------------------------------|
|FARGO rating lookup/API|Manual entry only for V1          |
|Social sharing         |Share game results to social media|
|Export game data       |CSV/JSON export of game history   |

### 8.6 Additional Games

|Item              |Notes                                   |
|------------------|----------------------------------------|
|9-ball scoring    |Starter template enables future fork    |
|8-ball scoring    |Starter template enables future fork    |
|One-pocket scoring|Starter template enables future fork    |
|Other domains     |Architecture supports non-pool use cases|

### 8.7 Localization

|Item         |Notes                                       |
|-------------|--------------------------------------------|
|Translated UI|i18n framework in place; English only for V1|

-----

## Section 9: Open Questions

### 9.1 Resolved

|ID  |Question          |Resolution                                        |
|----|------------------|--------------------------------------------------|
|BQ-1|Project name      |Break Shot                                        |
|BQ-3|Launch scope      |Private beta (invite only)                        |
|BQ-4|Feedback mechanism|In-app feedback form                              |
|TQ-4|Auth strategy     |Required sign-up                                  |
|TQ-5|Session expiry    |24 hours for unused sessions                      |
|UQ-1|Join code format  |Word-based (e.g., “blue-tiger-42”)                |
|UQ-2|Turn transition   |Auto-advance on foul/safety/end turn              |
|UQ-5|Rematch settings  |Allow adjustment (swap break, change target, etc.)|

### 9.2 Remaining Open Questions

#### Technical

|ID  |Question                                |Notes                                                                             |
|----|----------------------------------------|----------------------------------------------------------------------------------|
|TQ-1|FARGO handicap formula for straight pool|Research during implementation; fall back to simplified calculation if unavailable|
|TQ-2|Supabase Realtime limits on free tier   |Verify during setup                                                               |
|TQ-3|PWA offline boundaries with Supabase    |Architectural spike needed                                                        |

#### UX

|ID  |Question                                   |Notes                          |
|----|-------------------------------------------|-------------------------------|
|UQ-3|Show opponent when you’ve undone an action?|Decide during UX implementation|
|UQ-4|End game confirmation timeout              |Decide during implementation   |

#### Business / Product

|ID  |Question                         |Notes               |
|----|---------------------------------|--------------------|
|BQ-2|Custom domain or Vercel subdomain|Decide before launch|

#### Starter Template

|ID  |Question                           |Notes                      |
|----|-----------------------------------|---------------------------|
|SQ-1|Abstraction level for reusable core|Decide during architecture |
|SQ-2|Monorepo vs single app structure   |Decide during project setup|
|SQ-3|Documentation depth for forking    |Decide post-V1             |

-----

## Document History

| Version | Date             | Author         | Changes                                                                         |
| ------- | ---------------- | -------------- | ------------------------------------------------------------------------------- |
| 1.0     | January 17, 2026 | Kevin + Claude | Initial requirements document                                                   |
| 1.1     | January 17, 2026 | Kevin + Claude | Added SC-11 (safety scoring per WPA rules); changed to rack-based scoring model |