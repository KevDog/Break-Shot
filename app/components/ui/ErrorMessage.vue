<script setup lang="ts">
</script>

<template>
  <p
    data-slot="error"
    class="text-sm/6 text-error data-[disabled]:opacity-50"
  >
    <slot />
  </p>
</template>
