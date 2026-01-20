<template>
  <main class="min-h-screen flex items-center justify-center p-4 sm:p-6">
    <div class="w-full max-w-sm bg-bg-secondary rounded-2xl p-6 sm:p-8 ring-1 ring-white/10">
      <h1 class="text-2xl font-semibold text-center mb-1">{{ $t('auth.createAccount') }}</h1>
      <p class="text-sm/6 text-text-secondary text-center mb-8">{{ $t('auth.signUpToContinue') }}</p>

      <!-- Error message -->
      <div v-if="error" class="alert alert--error mb-6">
        {{ error }}
      </div>

      <!-- Success message -->
      <div v-if="success" class="alert alert--success mb-6 text-center">
        {{ $t('auth.checkEmail') }}
      </div>

      <!-- Social signup buttons -->
      <div v-if="!success" class="flex flex-col gap-3">
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
            <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>{{ $t('auth.continueWithFacebook') }}</span>
        </button>
      </div>

      <!-- Divider -->
      <div v-if="!success" class="divider-text">
        <span>{{ $t('auth.or') }}</span>
      </div>

      <!-- Email signup form -->
      <form v-if="!success" class="space-y-4" @submit.prevent="signUpWithEmail">
        <div>
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

        <div>
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

        <div>
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
      <div class="flex flex-col items-center gap-2 mt-6 text-sm">
        <NuxtLink to="/auth/login" class="text-text-secondary hover:text-accent no-underline">
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

definePageMeta({
  layout: 'default',
})

useHead({
  title: t('auth.signUp') + ' - Break Shot',
})
</script>
