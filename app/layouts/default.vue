<template>
  <div class="layout-default">
    <slot />
  </div>
</template>

<style scoped>
.layout-default {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
</style>
