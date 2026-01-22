# Break Shot - 14.1 Straight Pool Scoring

![GitHub Repo stars](https://img.shields.io/github/stars/kevdog/break-shot?style=social)
![GitHub issues](https://img.shields.io/github/issues/kevdog/break-shot)
![License](https://img.shields.io/github/license/kevdog/break-shot)
![Nuxt](https://img.shields.io/badge/nuxt-4.x-00DC82)
![TypeScript](https://img.shields.io/badge/typescript-5.x-3178C6)
![Tailwind CSS](https://img.shields.io/badge/tailwind%20css-4.x-38BDF8)

## Description

Break Shot is a modern, real-time multiplayer application for scoring 14.1 Straight Pool (also known as Continuous Pool) games. Built with Nuxt 3, TypeScript, and Supabase, it provides an intuitive interface for tracking scores, runs, fouls, and game statistics during pool matches.

### Features

- **Real-time Multiplayer**: Play with opponents online with live score updates
- **Comprehensive Scoring**: Track scores, runs, high runs, fouls, and innings
- **FARGO Rating Integration**: Input FARGO ratings for handicap calculations
- **Game Customization**: Set target scores, handicap options, and allow negative scoring
- **Progressive Web App**: Install on mobile devices for offline-capable gameplay
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Internationalization**: Multi-language support with i18n

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **Styling**: Tailwind CSS 4.x with Headless UI components
- **Backend**: Supabase (PostgreSQL, Real-time subscriptions, Authentication)
- **Testing**: Vitest with Vue Test Utils
- **Deployment**: Vercel with PWA support
- **Monitoring**: Sentry for error tracking

## Setup

### Prerequisites

- Node.js 18+ 
- npm, pnpm, yarn, or bun
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kevdog/break-shot.git
cd break-shot
```

2. Install dependencies:
```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env.local

# Add your Supabase credentials
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:
```bash
# Apply Supabase migrations
supabase db push
```

## Development

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run typecheck` - Run TypeScript type checking

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

## Game Rules & Scoring

Break Shot follows standard 14.1 Straight Pool rules:

- Players must call each shot (ball and pocket)
- Each legally pocketed ball scores 1 point
- Target score is typically 150 points (configurable)
- Three consecutive fouls result in a 15-point penalty
- Game continues until a player reaches the target score
- FARGO rating-based handicapping available

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Database Schema

The application uses Supabase with the following key tables:
- `sessions` - Game session management
- `players` - Player information and FARGO ratings
- `games` - Individual game records
- `events` - Game events (scores, fouls, etc.)

Migrations are located in `supabase/migrations/`.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Nuxt 3](https://nuxt.com/) framework
- Real-time functionality powered by [Supabase](https://supabase.com/)
- UI components from [Headless UI](https://headlessui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

For more information about deployment, check out the [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment).
