<template>
  <main class="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-6">
    <h1>Sentry Test Page</h1>
    <p>Click the button below to trigger a test error.</p>

    <button class="btn btn--primary" @click="triggerError">
      Trigger Test Error
    </button>

    <p class="text-text-secondary text-sm">
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
