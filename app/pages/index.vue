<template>
  <main class="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 text-center">
    <div class="max-w-sm w-full">
      <h1 class="text-3xl font-bold mb-2">{{ $t('app.name') }}</h1>
      <p class="text-lg text-text-secondary mb-12">{{ $t('app.description') }}</p>

      <div class="flex flex-col gap-4">
        <NuxtLink to="/session/create" class="btn btn--primary btn--large w-full no-underline">
          {{ $t('session.create') }}
        </NuxtLink>
        
        <!-- Local Game button -->
        <NuxtLink to="/local/setup" class="btn btn--secondary btn--large w-full no-underline">
          <span class="flex flex-col items-center gap-1">
            <span>{{ $t('session.localGame') }}</span>
            <span class="text-xs opacity-80">{{ $t('session.localGameDescription') }}</span>
          </span>
        </NuxtLink>
        
        <!-- Practice Mode button -->
        <NuxtLink to="/practice/setup" class="btn btn--secondary btn--large w-full no-underline">
          <span class="flex flex-col items-center gap-1">
            <span>{{ $t('session.practiceMode') }}</span>
            <span class="text-xs opacity-80">{{ $t('session.practiceModeDescription') }}</span>
          </span>
        </NuxtLink>
        
        <!-- Join game form (input only, no button) -->
        <div>
          <label for="joinCode" class="visually-hidden">{{ $t('session.joinCode') }}</label>
          <input
            id="joinCode"
            v-model="joinCode"
            type="text"
            :placeholder="$t('session.joinCode')"
            autocomplete="off"
            autocapitalize="off"
            :disabled="loading"
            class="text-center text-xl font-mono tracking-wider"
            @keyup.enter="handleJoinSession"
          />
        </div>
        
        <!-- Error message -->
        <div v-if="error" class="alert alert--error">
          {{ error }}
        </div>
      </div>
    </div>

    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-bg-secondary rounded-full ring-1 ring-white/10 text-sm/6 text-text-secondary">
      <span
        class="status-indicator"
        :class="{
          'status-indicator--online': connectionStatus === 'connected',
          'status-indicator--offline': connectionStatus === 'disconnected',
          'status-indicator--reconnecting': connectionStatus === 'reconnecting',
        }"
      />
      <span class="capitalize">
        {{ $t(`status.${connectionStatus === 'connected' ? 'online' : connectionStatus === 'disconnected' ? 'offline' : 'reconnecting'}`) }}
      </span>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { ConnectionStatus } from '~~/shared/types'

const { t } = useI18n()
const {
  session,
  loading,
  error,
  joinSession,
} = useSession()

// Connection status (will be implemented with Supabase realtime)
const connectionStatus = ref<ConnectionStatus>('connected')

const joinCode = ref('')

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
})

useHead({
  title: 'Break Shot - 14.1 Straight Pool Scoring',
})
</script>
