/**
 * Component tests for BallsRemaining
 * Tests the balls remaining counter display
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BallsRemaining from './BallsRemaining.vue'

describe('BallsRemaining', () => {
  it('displays initial 14 balls remaining', () => {
    const wrapper = mount(BallsRemaining, {
      props: { remainingBalls: 14, needsRerack: false },
    })

    expect(wrapper.find('[data-testid="balls-remaining-count"]').text()).toBe('14')
  })

  it('decrements when balls are made (scenario 2)', () => {
    const wrapper = mount(BallsRemaining, {
      props: { remainingBalls: 11, needsRerack: false },
    })

    expect(wrapper.find('[data-testid="balls-remaining-count"]').text()).toBe('11')
  })

  it('shows warning style when 3 or fewer balls remain', () => {
    const wrapper = mount(BallsRemaining, {
      props: { remainingBalls: 3, needsRerack: false },
    })

    const container = wrapper.find('[data-testid="balls-remaining-container"]')
    const count = wrapper.find('[data-testid="balls-remaining-count"]')

    expect(container.classes()).toContain('ring-warning')
    expect(count.classes()).toContain('text-warning')
  })

  it('shows normal style when more than 3 balls remain', () => {
    const wrapper = mount(BallsRemaining, {
      props: { remainingBalls: 10, needsRerack: false },
    })

    const container = wrapper.find('[data-testid="balls-remaining-container"]')
    const count = wrapper.find('[data-testid="balls-remaining-count"]')

    expect(container.classes()).not.toContain('ring-warning')
    expect(count.classes()).toContain('text-text-primary')
  })

  it('shows rerack style when 14 balls sunk (scenario 6)', () => {
    const wrapper = mount(BallsRemaining, {
      props: { remainingBalls: 0, needsRerack: true },
    })

    const container = wrapper.find('[data-testid="balls-remaining-container"]')
    const count = wrapper.find('[data-testid="balls-remaining-count"]')

    expect(container.classes()).toContain('ring-accent')
    expect(container.classes()).toContain('bg-accent/10')
    expect(count.classes()).toContain('text-accent')
  })

  it('resets to 14 after rerack (scenario 7)', () => {
    const wrapper = mount(BallsRemaining, {
      props: { remainingBalls: 14, needsRerack: false },
    })

    expect(wrapper.find('[data-testid="balls-remaining-count"]').text()).toBe('14')
  })

  it('shows 0 when all balls pocketed', () => {
    const wrapper = mount(BallsRemaining, {
      props: { remainingBalls: 0, needsRerack: true },
    })

    expect(wrapper.find('[data-testid="balls-remaining-count"]').text()).toBe('0')
  })
})
