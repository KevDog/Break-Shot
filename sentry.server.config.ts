import * as Sentry from '@sentry/nuxt'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'development',

  // Performance monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions in development
})
