<template>
  <main class="session-page">
    <div class="session-card">
      <!-- Loading state -->
      <div v-if="loading" class="session-card__loading">
        <div class="spinner" />
        <p>{{ $t('common.loading') }}</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="session-card__error">
        <h2>Failed to Create Session</h2>
        <p>{{ error }}</p>
        <button class="btn btn--primary" @click="handleCreateSession">
          {{ $t('common.retry') }}
        </button>
      </div>

      <!-- Session created - waiting for opponent -->
      <div v-else-if="session" class="session-card__content">
        <h1 class="session-card__title">{{ $t('session.shareCode') }}</h1>

        <div class="join-code">
          <span class="join-code__value">{{ session.joinCode }}</span>
          <button
            class="join-code__copy"
            :class="{ 'join-code__copy--copied': copied }"
            @click="copyJoinCode"
          >
            <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>

        <div class="waiting-indicator">
          <div class="waiting-indicator__dots">
            <span />
            <span />
            <span />
          </div>
          <p class="waiting-indicator__text">{{ $t('session.waiting') }}</p>
        </div>

        <div class="session-card__actions">
          <button class="btn btn--secondary" @click="handleCancel">
            {{ $t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const { t } = useI18n()
const {
  session,
  loading,
  error,
  createSession,
  subscribeToSession,
  clearSession
} = useSession()

const copied = ref(false)
let unsubscribe: (() => void) | null = null

async function handleCreateSession() {
  const result = await createSession()

  if (result.success && session.value) {
    // Subscribe to session changes for realtime updates
    unsubscribe = subscribeToSession(session.value.id)
  }
}

function copyJoinCode() {
  if (session.value?.joinCode) {
    navigator.clipboard.writeText(session.value.joinCode)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

function handleCancel() {
  if (unsubscribe) {
    unsubscribe()
  }
  clearSession()
  navigateTo('/')
}

// Watch for opponent joining (session status changes to 'setup')
watch(
  () => session.value?.status,
  (newStatus) => {
    if (newStatus === 'setup' && session.value) {
      navigateTo(`/session/${session.value.joinCode}/setup`)
    }
  }
)

// Create session on mount (client-side only)
onMounted(async () => {
  // Small delay to ensure auth state is hydrated
  await nextTick()
  handleCreateSession()
})

// Cleanup on unmount
onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

// Page meta
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

useHead({
  title: t('session.create') + ' - Break Shot',
})
</script>

<style scoped>
.session-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

.session-card {
  width: 100%;
  max-width: 400px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.session-card__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl) 0;
}

.session-card__loading p {
  color: var(--color-text-secondary);
}

.session-card__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  text-align: center;
}

.session-card__error p {
  color: var(--color-error);
}

.session-card__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xl);
}

.session-card__title {
  font-size: var(--font-size-xl);
  text-align: center;
}

.join-code {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
}

.join-code__value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  color: var(--color-accent);
}

.join-code__copy {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background-color: transparent;
  border: 1px solid var(--color-bg-elevated);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.join-code__copy:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.join-code__copy--copied {
  color: var(--color-success);
  border-color: var(--color-success);
}

.join-code__copy svg {
  width: 20px;
  height: 20px;
}

.waiting-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.waiting-indicator__dots {
  display: flex;
  gap: var(--spacing-xs);
}

.waiting-indicator__dots span {
  width: 8px;
  height: 8px;
  background-color: var(--color-accent);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.waiting-indicator__dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.waiting-indicator__dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.waiting-indicator__text {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
}

.session-card__actions {
  width: 100%;
}

.session-card__actions .btn {
  width: 100%;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-bg-elevated);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
