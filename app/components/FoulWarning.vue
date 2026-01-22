<template>
  <div
    v-if="consecutiveFouls >= 2"
    class="alert text-center"
    :class="consecutiveFouls === 2 ? 'alert--error font-semibold' : 'bg-warning/10 text-warning ring-warning/20'"
    data-testid="foul-warning"
  >
    Warning: {{ consecutiveFouls }} consecutive fouls
  </div>
</template>

<script setup lang="ts">
interface Props {
  consecutiveFouls: number
}

defineProps<Props>()
</script>
