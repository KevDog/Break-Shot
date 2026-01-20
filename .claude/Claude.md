Keep explanations brief and to the point.

Write unit and component tests for the following game play scenarios for Straight Pool, covering basic play, fouls, and other key situations before implementing them in code.

## 14.1 Straight Pool - Game Play Scenarios

### Basic Scenarios

1. **Player misses first shot** - Switch to other player. No score changes.
2. **Player makes shot(s)** - Increment their rack count. Balls Remaining decreases.
3. **Player commits foul on first shot** - Deduct 1 from grand total, switch player. (Opening break foul is different - see below)
4. **Player makes shot(s), then commits foul** - Add shots to rack count, deduct 1 from grand total, switch player. Balls pocketed on foul shot are spotted (don't count).
5. **Player makes shot(s), then hits safety** - Increment rack count for shots made before safety call, switch player. Balls pocketed on safety shot are spotted (don't count).
6. **14 balls sunk** - Activate 'Rerack' button. Current player continues shooting.
7. **Rerack** - Add each player's rack count to their grand total, zero out rack counts, reset Balls Remaining to 14, continue current player's turn.

### Foul Scenarios

1. **Consecutive fouls tracking** - Player fouls, then on next turn fouls again. Show warning at 2 consecutive fouls.
2. **Three consecutive fouls** - Player commits 3rd consecutive foul. Deduct 15 points from grand total, reset consecutive foul count to 0.
3. **Opening break foul** - First shot of the game is a foul. Deduct 2 points (not 1), give incoming player choice: Accept Table or Force Rebreak.
4. **Force Rebreak** - After opening break foul, incoming player chooses "Force Rebreak". Fouling player breaks again, Balls Remaining resets to 14.
5. **Scratch (cue ball pocketed)** - After opening break, handled as regular foul.

### Other Scenarios

1. **Undo** - Player can undo their last action(s) until opponent takes an action.
2. **Win condition** - Player's grand total (totalScore + rackScore) reaches target score. Game ends, winner declared. Buttons for "rematch" or "new game" appear.
3. **Negative scores** - If allowed in game settings, scores can go below zero. If not allowed, floor at zero.

### Key Rules

- **Grand total** only changes on: rerack (adds rack scores), foul (subtracts penalty), or handicap (initial value)
- **Rack count** accumulates legally pocketed balls until rerack
- **Balls pocketed on foul or safety** are spotted (returned to table), do not count toward rack count or Balls Remaining
- **Legal shot** (making balls, miss, safety) resets consecutive foul count to 0
