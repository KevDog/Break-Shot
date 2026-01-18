<template>
  <main class="auth-page">
    <div class="auth-card">
      <h1 class="auth-card__title">{{ $t('auth.resetPassword') }}</h1>
      <p class="auth-card__subtitle">{{ $t('auth.resetPasswordInstructions') }}</p>

      <!-- Error message -->
      <div v-if="error" class="auth-card__error">
        {{ error }}
      </div>

      <!-- Success message -->
      <div v-if="success" class="auth-card__success">
        {{ $t('auth.resetEmailSent') }}
      </div>

      <!-- Reset form -->
      <form v-if="!success" class="auth-form" @submit.prevent="resetPassword">
        <div class="auth-form__field">
          <label for="email" class="visually-hidden">{{ $t('auth.email') }}</label>
          <input
            id="email"
            v-model="email"
            type="email"
            :placeholder="$t('auth.email')"
            required
            autocomplete="email"
            :disabled="loading"
          />
        </div>

        <button type="submit" class="btn btn--primary btn--large btn--full" :disabled="loading">
          {{ loading ? $t('common.loading') : $t('auth.sendResetLink') }}
        </button>
      </form>

      <!-- Links -->
      <div class="auth-card__links">
        <NuxtLink to="/auth/login" class="auth-card__link">
          {{ $t('auth.backToLogin') }}
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const { t } = useI18n()

const email = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

async function resetPassword() {
  loading.value = true
  error.value = null

  const { error: authError } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  })

  if (authError) {
    error.value = authError.message
  } else {
    success.value = true
  }

  loading.value = false
}

// Page meta
definePageMeta({
  layout: 'default',
})

useHead({
  title: t('auth.resetPassword') + ' - Break Shot',
})
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.auth-card__title {
  font-size: var(--font-size-2xl);
  text-align: center;
  margin-bottom: var(--spacing-xs);
}

.auth-card__subtitle {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.auth-card__error {
  background-color: rgba(255, 68, 68, 0.1);
  border: 1px solid var(--color-error);
  color: var(--color-error);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-sm);
}

.auth-card__success {
  background-color: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--color-success);
  color: var(--color-success);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-sm);
  text-align: center;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.auth-form__field input {
  width: 100%;
}

.btn--full {
  width: 100%;
}

.auth-card__links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}

.auth-card__link {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.auth-card__link:hover {
  color: var(--color-accent);
}
</style>
