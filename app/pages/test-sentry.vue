<template>
  <main class="test-sentry">
    <h1>Sentry Test Page</h1>
    <p>Click the button below to trigger a test error.</p>

    <button class="btn btn--primary" @click="triggerError">
      Trigger Test Error
    </button>

    <p class="test-sentry__note">
      After clicking, check your Sentry dashboard for the error.
    </p>

    <NuxtLink to="/" class="btn btn--secondary">
      Back to Home
    </NuxtLink>
  </main>
</template>

<script setup lang="ts">
function triggerError() {
  throw new Error('Test error from Break Shot - Sentry is working!')
}

useHead({
  title: 'Test Sentry - Break Shot',
})
</script>

<style scoped>
.test-sentry {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--spacing-lg);
  text-align: center;
  gap: var(--spacing-lg);
}

.test-sentry__note {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
</style>
