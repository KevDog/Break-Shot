<template>
  <main class="session-page">
    <div class="session-card">
      <h1 class="session-card__title">{{ $t('session.join') }}</h1>
      <p class="session-card__subtitle">{{ $t('session.enterCode') }}</p>

      <!-- Error message -->
      <div v-if="error" class="session-card__error">
        {{ error }}
      </div>

      <!-- Join form -->
      <form class="join-form" @submit.prevent="handleJoinSession">
        <div class="join-form__field">
          <label for="joinCode" class="visually-hidden">{{ $t('session.joinCode') }}</label>
          <input
            id="joinCode"
            v-model="joinCode"
            type="text"
            :placeholder="$t('session.joinCode')"
            required
            autocomplete="off"
            autocapitalize="off"
            :disabled="loading"
            class="join-form__input"
          />
        </div>

        <button
          type="submit"
          class="btn btn--primary btn--large btn--full"
          :disabled="loading || !joinCode.trim()"
        >
          {{ loading ? $t('common.loading') : $t('session.join') }}
        </button>
      </form>

      <!-- Back link -->
      <div class="session-card__links">
        <NuxtLink to="/" class="session-card__link">
          {{ $t('common.back') }}
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const {
  session,
  loading,
  error,
  joinSession,
} = useSession()

// Allow join code to be passed via query param
const joinCode = ref((route.query.code as string) || '')

async function handleJoinSession() {
  if (!joinCode.value.trim()) return

  const result = await joinSession(joinCode.value.trim())

  if (result.success && session.value) {
    navigateTo(`/session/${session.value.id}/setup`)
  }
}

// Page meta
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

useHead({
  title: t('session.join') + ' - Break Shot',
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

.session-card__title {
  font-size: var(--font-size-2xl);
  text-align: center;
  margin-bottom: var(--spacing-xs);
}

.session-card__subtitle {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.session-card__error {
  background-color: rgba(255, 68, 68, 0.1);
  border: 1px solid var(--color-error);
  color: var(--color-error);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-sm);
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.join-form__input {
  width: 100%;
  text-align: center;
  font-size: var(--font-size-xl);
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
}

.btn--full {
  width: 100%;
}

.session-card__links {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-lg);
}

.session-card__link {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.session-card__link:hover {
  color: var(--color-accent);
}
</style>
