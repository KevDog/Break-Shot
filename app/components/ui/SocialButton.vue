<template>
  <button
    class="btn btn--social"
    :class="socialClass"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <component :is="iconComponent" class="btn__icon" />
    <span>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import GoogleIcon from './icons/GoogleIcon.vue'
import AppleIcon from './icons/AppleIcon.vue'
import FacebookIcon from './icons/FacebookIcon.vue'

interface Props {
  provider: 'google' | 'apple' | 'facebook'
  label: string
  disabled?: boolean
}

interface Emits {
  click: []
}

const props = defineProps<Props>()
defineEmits<Emits>()

const iconComponent = computed(() => {
  switch (props.provider) {
    case 'google':
      return GoogleIcon
    case 'apple':
      return AppleIcon
    case 'facebook':
      return FacebookIcon
    default:
      return GoogleIcon
  }
})

const socialClass = computed(() => {
  switch (props.provider) {
    case 'google':
      return 'btn--google'
    case 'apple':
      return 'btn--apple'
    case 'facebook':
      return 'btn--facebook'
    default:
      return 'btn--google'
  }
})
</script>