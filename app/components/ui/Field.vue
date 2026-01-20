<script setup lang="ts">
import { provide, computed } from 'vue'

interface Props {
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

// Provide field context to child components
provide('field-disabled', computed(() => props.disabled))
</script>

<template>
  <div
    class="[&>[data-slot=label]+[data-slot=control]]:mt-3 [&>[data-slot=label]+[data-slot=description]]:mt-1 [&>[data-slot=description]+[data-slot=control]]:mt-3 [&>[data-slot=control]+[data-slot=description]]:mt-3 [&>[data-slot=control]+[data-slot=error]]:mt-3 [&>[data-slot=label]]:font-medium"
    :data-disabled="disabled || undefined"
  >
    <slot />
  </div>
</template>
