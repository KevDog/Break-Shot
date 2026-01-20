<template>
  <main class="flex-1 flex items-center justify-center p-4 sm:p-6">
    <div class="w-full max-w-sm bg-bg-secondary rounded-2xl p-6 sm:p-8 ring-1 ring-white/10">
      <h1 class="text-2xl font-semibold text-center mb-1">{{ $t('session.join') }}</h1>
      <p class="text-sm/6 text-text-secondary text-center mb-8">{{ $t('session.enterCode') }}</p>

      <!-- Error message -->
      <div v-if="error" class="alert alert--error mb-6">
        {{ error }}
      </div>

      <!-- Join form -->
      <form class="space-y-4" @submit.prevent="handleJoinSession">
        <div>
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
            class="text-center text-xl font-mono tracking-wider"
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
      <div class="flex justify-center mt-6 text-sm">
        <NuxtLink to="/" class="text-text-secondary hover:text-accent no-underline">
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
    navigateTo(`/session/${session.value.joinCode}/setup`)
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
