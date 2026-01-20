<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'

interface Props {
  modelValue?: string | number
  name?: string
  id?: string
  disabled?: boolean
  invalid?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  invalid: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

// Get disabled state from parent Field if available
const fieldDisabled = inject<Ref<boolean>>('field-disabled', computed(() => false))

const isDisabled = computed(() => props.disabled || fieldDisabled.value)

const selectClasses = computed(() => {
  const base = [
    'relative block w-full appearance-none rounded-lg py-[calc(theme(spacing[2.5])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]',
    'pl-[calc(theme(spacing[3.5])-1px)] pr-[calc(theme(spacing[10])-1px)] sm:pl-[calc(theme(spacing[3])-1px)] sm:pr-[calc(theme(spacing[9])-1px)]',
    'text-base/6 text-text-primary sm:text-sm/6',
    'border border-bg-elevated bg-bg-tertiary',
    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
    '[&_*]:text-text-primary',
  ]

  if (props.invalid) {
    base.push('border-error focus:ring-error')
  }

  if (isDisabled.value) {
    base.push('opacity-50 bg-bg-secondary cursor-not-allowed')
  }

  return base.join(' ')
})

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <span
    data-slot="control"
    class="relative block w-full before:absolute before:inset-px before:rounded-[calc(theme(borderRadius.lg)-1px)] before:bg-bg-tertiary before:shadow-sm after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-inset after:ring-transparent sm:after:focus-within:ring-2 sm:after:focus-within:ring-accent has-[[data-disabled]]:opacity-50 before:has-[[data-disabled]]:bg-bg-secondary before:has-[[data-disabled]]:shadow-none"
  >
    <select
      :id="id"
      :name="name"
      :value="modelValue"
      :disabled="isDisabled"
      :data-disabled="isDisabled || undefined"
      :data-invalid="invalid || undefined"
      :class="selectClasses"
      @change="handleChange"
    >
      <slot />
    </select>
    <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
      <ChevronDownIcon class="size-5 text-text-muted" aria-hidden="true" />
    </span>
  </span>
</template>
