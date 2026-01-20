<script setup lang="ts">
interface Props {
  for?: string
}

defineProps<Props>()
</script>

<template>
  <label
    :for="$props.for"
    data-slot="label"
    class="select-none text-sm/6 font-medium text-text-primary data-[disabled]:opacity-50 sm:text-sm/6"
  >
    <slot />
  </label>
</template>
