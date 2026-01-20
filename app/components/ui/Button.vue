<script setup lang="ts">
import { computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  // Base styles
  'relative isolate inline-flex items-center justify-center gap-x-2 rounded-lg border text-base/6 font-semibold px-[calc(theme(spacing.3)-1px)] py-[calc(theme(spacing[1.5])-1px)] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing[1.5])-1px)] sm:text-sm/6 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed [&>[data-slot=icon]]:-mx-0.5 [&>[data-slot=icon]]:my-0.5 [&>[data-slot=icon]]:size-5 [&>[data-slot=icon]]:shrink-0 [&>[data-slot=icon]]:sm:my-1 [&>[data-slot=icon]]:sm:size-4 forced-colors:disabled:text-[GrayText] forced-colors:[--btn-icon:ButtonText]',
  {
    variants: {
      color: {
        primary: 'border-transparent bg-accent text-bg-primary hover:bg-accent-dim active:bg-accent-dim forced-colors:bg-[Highlight] forced-colors:hover:bg-[Highlight]',
        secondary: 'border-transparent bg-bg-elevated text-text-primary hover:bg-bg-tertiary active:bg-bg-tertiary',
        danger: 'border-transparent bg-error text-white hover:bg-red-600 active:bg-red-700',
        white: 'border-bg-elevated bg-white text-gray-900 hover:bg-gray-50 active:bg-gray-100',
        dark: 'border-transparent bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700',
      },
      outline: {
        true: '',
        false: '',
      },
      plain: {
        true: 'border-transparent bg-transparent',
        false: '',
      },
      size: {
        sm: 'px-2 py-1 text-sm',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2.5 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      // Outline variants
      {
        outline: true,
        color: 'primary',
        class: 'border-accent bg-transparent text-accent hover:bg-accent/10',
      },
      {
        outline: true,
        color: 'secondary',
        class: 'border-bg-elevated bg-transparent text-text-primary hover:bg-bg-secondary',
      },
      {
        outline: true,
        color: 'danger',
        class: 'border-error bg-transparent text-error hover:bg-error/10',
      },
      // Plain variants
      {
        plain: true,
        class: 'border-transparent bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary',
      },
    ],
    defaultVariants: {
      color: 'primary',
      outline: false,
      plain: false,
      size: 'md',
      fullWidth: false,
    },
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

interface Props {
  type?: 'button' | 'submit' | 'reset'
  color?: ButtonVariants['color']
  outline?: boolean
  plain?: boolean
  size?: ButtonVariants['size']
  fullWidth?: boolean
  disabled?: boolean
  href?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  color: 'primary',
  outline: false,
  plain: false,
  size: 'md',
  fullWidth: false,
  disabled: false,
})

const classes = computed(() =>
  buttonVariants({
    color: props.color,
    outline: props.outline,
    plain: props.plain,
    size: props.size,
    fullWidth: props.fullWidth,
  })
)
</script>

<template>
  <NuxtLink
    v-if="href"
    :to="href"
    :class="classes"
  >
    <slot />
  </NuxtLink>
  <button
    v-else
    :type="type"
    :disabled="disabled"
    :class="classes"
  >
    <slot />
  </button>
</template>
