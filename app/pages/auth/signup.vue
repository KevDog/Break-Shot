<template>
  <main class="auth-page">
    <div class="auth-card">
      <h1 class="auth-card__title">{{ $t('auth.createAccount') }}</h1>
      <p class="auth-card__subtitle">{{ $t('auth.signUpToContinue') }}</p>

      <!-- Error message -->
      <div v-if="error" class="auth-card__error">
        {{ error }}
      </div>

      <!-- Success message -->
      <div v-if="success" class="auth-card__success">
        {{ $t('auth.checkEmail') }}
      </div>

      <!-- Social signup buttons -->
      <div v-if="!success" class="auth-card__providers">
        <button
          class="btn btn--social btn--google"
          :disabled="loading"
          @click="signUpWithGoogle"
        >
          <svg class="btn__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{{ $t('auth.continueWithGoogle') }}</span>
        </button>

        <button
          class="btn btn--social btn--apple"
          :disabled="loading"
          @click="signUpWithApple"
        >
          <svg class="btn__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          <span>{{ $t('auth.continueWithApple') }}</span>
        </button>

        <button
          class="btn btn--social btn--facebook"
          :disabled="loading"
          @click="signUpWithFacebook"
        >
          <svg class="btn__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>{{ $t('auth.continueWithFacebook') }}</span>
        </button>
      </div>

      <!-- Divider -->
      <div v-if="!success" class="auth-card__divider">
        <span>{{ $t('auth.or') }}</span>
      </div>

      <!-- Email signup form -->
      <form v-if="!success" class="auth-form" @submit.prevent="signUpWithEmail">
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

        <div class="auth-form__field">
          <label for="password" class="visually-hidden">{{ $t('auth.password') }}</label>
          <input
            id="password"
            v-model="password"
            type="password"
            :placeholder="$t('auth.password')"
            required
            autocomplete="new-password"
            minlength="8"
            :disabled="loading"
          />
        </div>

        <div class="auth-form__field">
          <label for="confirmPassword" class="visually-hidden">{{ $t('auth.confirmPassword') }}</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            :placeholder="$t('auth.confirmPassword')"
            required
            autocomplete="new-password"
            minlength="8"
            :disabled="loading"
          />
        </div>

        <button type="submit" class="btn btn--primary btn--large btn--full" :disabled="loading">
          {{ loading ? $t('common.loading') : $t('auth.signUp') }}
        </button>
      </form>

      <!-- Links -->
      <div class="auth-card__links">
        <NuxtLink to="/auth/login" class="auth-card__link">
          {{ $t('auth.alreadyHaveAccount') }}
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

// Redirect URL for OAuth (computed on client-side only)
const redirectTo = computed(() => {
  if (import.meta.client) {
    return `${window.location.origin}/auth/confirm`
  }
  return '/auth/confirm'
})

async function signUpWithGoogle() {
  loading.value = true
  error.value = null

  const { error: authError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo.value },
  })

  if (authError) {
    error.value = authError.message
    loading.value = false
  }
}

async function signUpWithApple() {
  loading.value = true
  error.value = null

  const { error: authError } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: redirectTo.value },
  })

  if (authError) {
    error.value = authError.message
    loading.value = false
  }
}

async function signUpWithFacebook() {
  loading.value = true
  error.value = null

  const { error: authError } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: { redirectTo: redirectTo.value },
  })

  if (authError) {
    error.value = authError.message
    loading.value = false
  }
}

async function signUpWithEmail() {
  // Validate passwords match
  if (password.value !== confirmPassword.value) {
    error.value = t('auth.passwordsMustMatch')
    return
  }

  loading.value = true
  error.value = null

  const { error: authError } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      emailRedirectTo: redirectTo.value,
    },
  })

  if (authError) {
    error.value = authError.message
    loading.value = false
  } else {
    success.value = true
    loading.value = false
  }
}

// Page meta
definePageMeta({
  layout: 'default',
})

useHead({
  title: t('auth.signUp') + ' - Break Shot',
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

.auth-card__providers {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.btn--social {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  width: 100%;
  min-height: var(--button-height);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}

.btn--google {
  background-color: #ffffff;
  color: #1f1f1f;
}

.btn--google:hover:not(:disabled) {
  background-color: #f5f5f5;
}

.btn--apple {
  background-color: #000000;
  color: #ffffff;
  border: 1px solid var(--color-bg-elevated);
}

.btn--apple:hover:not(:disabled) {
  background-color: #1a1a1a;
}

.btn--facebook {
  background-color: #1877F2;
  color: #ffffff;
}

.btn--facebook:hover:not(:disabled) {
  background-color: #166fe5;
}

.btn__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.auth-card__divider {
  display: flex;
  align-items: center;
  margin: var(--spacing-lg) 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.auth-card__divider::before,
.auth-card__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--color-bg-elevated);
}

.auth-card__divider span {
  padding: 0 var(--spacing-md);
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
