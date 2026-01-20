/**
 * Component tests for FoulWarning
 * Tests the consecutive foul warning display
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FoulWarning from './FoulWarning.vue'

describe('FoulWarning', () => {
  it('does not show warning when 0 consecutive fouls', () => {
    const wrapper = mount(FoulWarning, {
      props: { consecutiveFouls: 0 },
    })

    expect(wrapper.find('[data-testid="foul-warning"]').exists()).toBe(false)
  })

  it('does not show warning when 1 consecutive foul', () => {
    const wrapper = mount(FoulWarning, {
      props: { consecutiveFouls: 1 },
    })

    expect(wrapper.find('[data-testid="foul-warning"]').exists()).toBe(false)
  })

  it('shows warning at 2 consecutive fouls (scenario F1)', () => {
    const wrapper = mount(FoulWarning, {
      props: { consecutiveFouls: 2 },
    })

    const warning = wrapper.find('[data-testid="foul-warning"]')
    expect(warning.exists()).toBe(true)
    expect(warning.text()).toContain('2 consecutive fouls')
  })

  it('applies error styling at 2 fouls (next is penalty)', () => {
    const wrapper = mount(FoulWarning, {
      props: { consecutiveFouls: 2 },
    })

    const warning = wrapper.find('[data-testid="foul-warning"]')
    expect(warning.classes()).toContain('alert--error')
    expect(warning.classes()).toContain('font-semibold')
  })

  it('hides after 3rd foul resets count (scenario F2)', () => {
    // After 3rd foul, consecutiveFouls resets to 0
    const wrapper = mount(FoulWarning, {
      props: { consecutiveFouls: 0 },
    })

    expect(wrapper.find('[data-testid="foul-warning"]').exists()).toBe(false)
  })

  it('hides after legal shot resets fouls', () => {
    // Legal shot resets consecutive fouls to 0
    const wrapper = mount(FoulWarning, {
      props: { consecutiveFouls: 0 },
    })

    expect(wrapper.find('[data-testid="foul-warning"]').exists()).toBe(false)
  })
})
