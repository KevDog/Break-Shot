<template>
  <main class="min-h-screen flex items-center justify-center p-4 sm:p-6">
    <div class="w-full max-w-sm bg-bg-secondary rounded-2xl p-6 sm:p-8 ring-1 ring-white/10">
      <h1 class="text-2xl font-semibold text-center mb-1">{{ $t('auth.resetPassword') }}</h1>
      <p class="text-sm/6 text-text-secondary text-center mb-8">{{ $t('auth.resetPasswordInstructions') }}</p>

      <!-- Error message -->
      <div v-if="error" class="alert alert--error mb-6">
        {{ error }}
      </div>

      <!-- Success message -->
      <div v-if="success" class="alert alert--success mb-6 text-center">
        {{ $t('auth.resetEmailSent') }}
      </div>

      <!-- Reset form -->
      <form v-if="!success" class="space-y-4" @submit.prevent="resetPassword">
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

        <button type="submit" class="btn btn--primary btn--large btn--full" :disabled="loading">
          {{ loading ? $t('common.loading') : $t('auth.sendResetLink') }}
        </button>
      </form>

      <!-- Links -->
      <div class="flex flex-col items-center gap-2 mt-6 text-sm">
        <NuxtLink to="/auth/login" class="text-text-secondary hover:text-accent no-underline">
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
