<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'

interface Props {
  modelValue?: string | number
  type?: string
  name?: string
  id?: string
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  autocomplete?: string
  minlength?: number
  min?: number | string
  max?: number | string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  invalid: false,
  required: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'blur', event: FocusEvent): void
}>()

// Get disabled state from parent Field if available
const fieldDisabled = inject<Ref<boolean>>('field-disabled', computed(() => false))

const isDisabled = computed(() => props.disabled || fieldDisabled.value)

const inputClasses = computed(() => {
  const base = [
    'relative block w-full appearance-none rounded-lg px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing[3])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]',
    'text-base/6 text-text-primary placeholder:text-text-muted sm:text-sm/6',
    'border border-bg-elevated bg-bg-tertiary',
    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
    'data-[disabled]:opacity-50 data-[disabled]:bg-bg-secondary data-[disabled]:cursor-not-allowed',
  ]

  if (props.invalid) {
    base.push('border-error focus:ring-error')
  }

  return base.join(' ')
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? (target.value === '' ? '' : Number(target.value)) : target.value
  emit('update:modelValue', value)
}

function handleBlur(event: FocusEvent) {
  emit('blur', event)
}
</script>

<template>
  <span
    data-slot="control"
    class="relative block w-full before:absolute before:inset-px before:rounded-[calc(theme(borderRadius.lg)-1px)] before:bg-bg-tertiary before:shadow-sm after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-inset after:ring-transparent sm:after:focus-within:ring-2 sm:after:focus-within:ring-accent has-[[data-disabled]]:opacity-50 before:has-[[data-disabled]]:bg-bg-secondary before:has-[[data-disabled]]:shadow-none before:has-[[data-invalid]]:shadow-error/10"
  >
    <input
      :id="id"
      :type="type"
      :name="name"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="isDisabled"
      :autocomplete="autocomplete"
      :minlength="minlength"
      :min="min"
      :max="max"
      :required="required"
      :data-disabled="isDisabled || undefined"
      :data-invalid="invalid || undefined"
      :class="inputClasses"
      @input="handleInput"
      @blur="handleBlur"
    />
  </span>
</template>
