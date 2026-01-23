<template>
  <main class="flex-1 flex items-center justify-center p-4 sm:p-6">
    <div class="w-full max-w-sm bg-bg-secondary rounded-2xl p-6 sm:p-8 ring-1 ring-white/10">
      <!-- Loading state -->
      <div v-if="loading" class="flex flex-col items-center gap-4 py-8">
        <div class="spinner" />
        <p class="text-sm/6 text-text-secondary">{{ $t('common.loading') }}</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="flex flex-col items-center gap-4 text-center">
        <h2 class="text-xl font-semibold">Failed to Create Session</h2>
        <p class="text-sm/6 text-error">{{ error }}</p>
        <button class="btn btn--primary" @click="handleCreateSession">
          {{ $t('common.retry') }}
        </button>
      </div>

      <!-- Session created - waiting for opponent -->
      <div v-else-if="session" class="flex flex-col items-center gap-8">
        <h1 class="text-xl font-semibold text-center">{{ $t('session.shareCode') }}</h1>

        <div class="flex items-center gap-4 p-6 bg-bg-elevated rounded-xl ring-1 ring-white/5">
          <span class="text-2xl font-bold font-mono tracking-wider text-accent">{{ session.joinCode }}</span>
          <button
            class="flex items-center justify-center w-10 h-10 p-0 bg-transparent border border-white/10 rounded-lg text-text-secondary cursor-pointer transition-all duration-100 hover:bg-bg-secondary hover:text-text-primary"
            :class="{ 'text-success border-success': copied }"
            @click="copyJoinCode"
          >
            <svg v-if="!copied" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>

        <div class="flex flex-col items-center gap-2">
          <div class="animate-bounce-dots flex gap-1">
            <span class="bg-accent" />
            <span class="bg-accent" />
            <span class="bg-accent" />
          </div>
          <p class="text-sm/6 text-text-secondary">{{ $t('session.waiting') }}</p>
        </div>

        <div class="w-full">
          <button class="btn btn--secondary w-full" @click="handleCancel">
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
  (newStatus, oldStatus) => {
    console.log('Session status changed from', oldStatus, 'to', newStatus)
    if (newStatus === 'setup' && session.value) {
      console.log('Navigating to setup page...')
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
