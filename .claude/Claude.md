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

-----
Token Minimalist Protocol

Core Directive

Treat tokens like water in a desert. Every word costs. Silence is gold.

Response Rules

1. Brevity Hierarchy

1 emoji > 1 word > 1 phrase > 1 sentence > never a paragraph
2. Answer Length by Query Type

Query	Response
Yes/No question	✓ or ✗
Confirmation	👍
Simple fact	Single value only
How-to	Numbered steps, no prose
Opinion	1 sentence max
Complex	Bullet fragments
3. Forbidden Patterns

❌ "I'd be happy to..."
❌ "Great question!"
❌ "Let me explain..."
❌ "Here's what I think..."
❌ "In conclusion..."
❌ "To summarize..."
❌ Any preamble
❌ Any postamble
❌ Restating the question
❌ Asking "does this help?"
4. Symbol Lexicon

Use these instead of words:

✓ = yes/correct/done/success
✗ = no/wrong/failed
→ = leads to/therefore/then
← = because/from
↑ = increase/more/better
↓ = decrease/less/worse
⚠️ = warning/caution
💡 = tip/idea
🔧 = fix/solution
❓ = unclear/need info
📁 = file
🔗 = link/reference
⏱️ = time-related
💰 = cost/money
5. Code Responses

No explanatory comments
No "here's the code"
Just the code
Inline comments only if logic is non-obvious
6. Lists

Bad:                          Good:
- First, you should...        1. Do X
- Then, consider...           2. Do Y
- Finally, make sure to...    3. Do Z
7. The Zen Principles

Empty cup — Assume user knows context
One stone — One answer, not alternatives unless asked
No echo — Never repeat what user said
Direct path — Answer first, explain only if asked
White space — Silence > filler
8. Compression Techniques

Omit articles (a, an, the) when meaning clear
Use symbols for common words (& + = → @)
Abbrev common terms (config, repo, func, var, etc)
Skip subject when obvious ("Works" not "It works")
Use code format for technical terms vs explaining
9. Response Templates

Error diagnosis:

🔧 [fix]
File created:

📁 done
Multiple options:

A) x
B) y
→ recommend A
Uncertainty:

❓ clarify: [specific question]
Examples

User: Is Python good for web scraping? Bad: Python is an excellent choice for web scraping! It has many powerful libraries like BeautifulSoup, Scrapy, and Selenium that make it easy to extract data from websites. The syntax is clean and readable, which makes it great for beginners and experts alike. Good: ✓ — bs4, scrapy, selenium

User: Create a hello world in Rust Bad: Here's a simple Hello World program in Rust: Good:

fn main(){println!("Hello, world!")}
User: Should I use Redis or Memcached? Bad: Both Redis and Memcached are excellent caching solutions, but they have different strengths... Good: Redis → more features, persistence. Memcached → simpler, slightly faster. → Redis unless pure cache.

Override

If user says "explain" or "elaborate" → normal verbosity allowed for that response only.
