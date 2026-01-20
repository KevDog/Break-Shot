<template>
  <main class="min-h-screen flex items-center justify-center p-4 sm:p-6">
    <div class="w-full max-w-sm bg-bg-secondary rounded-2xl p-6 sm:p-8 ring-1 ring-white/10 text-center">
      <div v-if="loading" class="flex flex-col items-center gap-4">
        <div class="spinner" />
        <p class="text-sm/6 text-text-secondary">{{ $t('auth.confirmingAuth') }}</p>
      </div>

      <div v-else-if="error" class="flex flex-col items-center gap-4">
        <h2 class="text-xl font-semibold text-error">{{ $t('auth.authFailed') }}</h2>
        <p class="text-sm/6 text-text-secondary mb-4">{{ error }}</p>
        <NuxtLink to="/auth/login" class="btn btn--primary">
          {{ $t('auth.backToLogin') }}
        </NuxtLink>
      </div>

      <div v-else class="flex flex-col items-center gap-4">
        <h2 class="text-xl font-semibold text-success">{{ $t('auth.authSuccess') }}</h2>
        <p class="text-sm/6 text-text-secondary">{{ $t('auth.redirecting') }}</p>
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
