<template>
  <main class="landing">
    <div class="landing__content">
      <h1 class="landing__title">{{ $t('app.name') }}</h1>
      <p class="landing__subtitle">{{ $t('app.description') }}</p>

      <div class="landing__actions">
        <NuxtLink to="/session/create" class="btn btn--primary btn--large">
          {{ $t('session.create') }}
        </NuxtLink>
        <NuxtLink to="/session/join" class="btn btn--secondary btn--large">
          {{ $t('session.join') }}
        </NuxtLink>
      </div>
    </div>

    <div class="landing__status">
      <span
        class="status-indicator"
        :class="{
          'status-indicator--online': connectionStatus === 'connected',
          'status-indicator--offline': connectionStatus === 'disconnected',
          'status-indicator--reconnecting': connectionStatus === 'reconnecting',
        }"
      />
      <span class="landing__status-text">
        {{ $t(`status.${connectionStatus === 'connected' ? 'online' : connectionStatus === 'disconnected' ? 'offline' : 'reconnecting'}`) }}
      </span>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { ConnectionStatus } from '~~/shared/types'

// Connection status (will be implemented with Supabase realtime)
const connectionStatus = ref<ConnectionStatus>('connected')

// Page meta
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Break Shot - 14.1 Straight Pool Scoring',
})
</script>

<style scoped>
.landing {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-lg);
  text-align: center;
}

.landing__content {
  max-width: 400px;
  width: 100%;
}

.landing__title {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-sm);
}

.landing__subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-2xl);
}

.landing__actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.landing__actions .btn {
  width: 100%;
  text-decoration: none;
}

.landing__status {
  position: fixed;
  bottom: var(--spacing-lg);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.landing__status-text {
  text-transform: capitalize;
}
</style>
