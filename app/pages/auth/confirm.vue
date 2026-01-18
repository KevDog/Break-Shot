<template>
  <main class="auth-page">
    <div class="auth-card auth-card--confirm">
      <div v-if="loading" class="auth-confirm__loading">
        <div class="spinner" />
        <p>{{ $t('auth.confirmingAuth') }}</p>
      </div>

      <div v-else-if="error" class="auth-confirm__error">
        <h2>{{ $t('auth.authFailed') }}</h2>
        <p>{{ error }}</p>
        <NuxtLink to="/auth/login" class="btn btn--primary">
          {{ $t('auth.backToLogin') }}
        </NuxtLink>
      </div>

      <div v-else class="auth-confirm__success">
        <h2>{{ $t('auth.authSuccess') }}</h2>
        <p>{{ $t('auth.redirecting') }}</p>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const route = useRoute()
const { t } = useI18n()

const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  // Handle OAuth callback
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const queryParams = route.query

  // Check for error in URL
  const errorParam = hashParams.get('error') || queryParams.error
  const errorDescription = hashParams.get('error_description') || queryParams.error_description

  if (errorParam) {
    error.value = typeof errorDescription === 'string' ? errorDescription : errorParam.toString()
    loading.value = false
    return
  }

  // Check for access token (OAuth flow)
  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')

  if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError) {
      error.value = sessionError.message
      loading.value = false
      return
    }
  }

  // Check for email confirmation code
  const tokenHash = queryParams.token_hash
  const type = queryParams.type

  if (tokenHash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash as string,
      type: type as 'signup' | 'recovery' | 'email',
    })

    if (verifyError) {
      error.value = verifyError.message
      loading.value = false
      return
    }
  }

  // Success - redirect to home or saved redirect
  loading.value = false

  // Small delay to show success message
  setTimeout(() => {
    navigateTo('/')
  }, 1000)
})

// Page meta
definePageMeta({
  layout: 'default',
})

useHead({
  title: t('auth.confirming') + ' - Break Shot',
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

.auth-card--confirm {
  width: 100%;
  max-width: 400px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
}

.auth-confirm__loading,
.auth-confirm__error,
.auth-confirm__success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.auth-confirm__loading p,
.auth-confirm__success p {
  color: var(--color-text-secondary);
}

.auth-confirm__error h2 {
  color: var(--color-error);
}

.auth-confirm__error p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.auth-confirm__success h2 {
  color: var(--color-success);
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
