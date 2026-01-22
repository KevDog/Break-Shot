/**
 * Component tests for GameScoreboard
 * Tests that the UI displays correct values based on game state
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GameScoreboard from './GameScoreboard.vue'

const defaultProps = {
  player1Name: 'Alice',
  player1Id: 'p1',
  player1Total: 0,
  player1Rack: 0,
  player1Run: 0,
  player1Fouls: 0,
  player2Name: 'Bob',
  player2Id: 'p2',
  player2Total: 0,
  player2Rack: 0,
  player2Run: 0,
  player2Fouls: 0,
  isPlayer1Turn: true,
  targetScore: 100,
  inning: 1,
  racks: 0,
  winnerId: undefined,
}

describe('GameScoreboard', () => {
  it('displays player names correctly', () => {
    const wrapper = mount(GameScoreboard, { props: defaultProps })

    expect(wrapper.find('[data-testid="player1-name"]').text()).toBe('Alice')
    expect(wrapper.find('[data-testid="player2-name"]').text()).toBe('Bob')
  })

  it('displays initial scores as zero', () => {
    const wrapper = mount(GameScoreboard, { props: defaultProps })

    expect(wrapper.find('[data-testid="player1-total"]').text()).toBe('0')
    expect(wrapper.find('[data-testid="player1-rack"]').text()).toBe('0')
    expect(wrapper.find('[data-testid="player2-total"]').text()).toBe('0')
    expect(wrapper.find('[data-testid="player2-rack"]').text()).toBe('0')
  })

  it('displays Total and Rack scores separately', () => {
    const wrapper = mount(GameScoreboard, {
      props: {
        ...defaultProps,
        player1Total: 50,
        player1Rack: 7,
      },
    })

    expect(wrapper.find('[data-testid="player1-total"]').text()).toBe('50')
    expect(wrapper.find('[data-testid="player1-rack"]').text()).toBe('7')
  })

  it('highlights active player (player1 turn)', () => {
    const wrapper = mount(GameScoreboard, {
      props: { ...defaultProps, isPlayer1Turn: true },
    })

    const player1Section = wrapper.find('[data-testid="player1-section"]')
    const player2Section = wrapper.find('[data-testid="player2-section"]')

    expect(player1Section.classes()).toContain('ring-accent')
    expect(player2Section.classes()).not.toContain('ring-accent')
  })

  it('highlights active player (player2 turn)', () => {
    const wrapper = mount(GameScoreboard, {
      props: { ...defaultProps, isPlayer1Turn: false },
    })

    const player1Section = wrapper.find('[data-testid="player1-section"]')
    const player2Section = wrapper.find('[data-testid="player2-section"]')

    expect(player1Section.classes()).not.toContain('ring-accent')
    expect(player2Section.classes()).toContain('ring-accent')
  })

  it('displays current run for each player', () => {
    const wrapper = mount(GameScoreboard, {
      props: {
        ...defaultProps,
        player1Run: 5,
        player2Run: 3,
      },
    })

    expect(wrapper.find('[data-testid="player1-run"]').text()).toBe('Run: 5')
    expect(wrapper.find('[data-testid="player2-run"]').text()).toBe('Run: 3')
  })

  it('shows consecutive fouls when greater than zero', () => {
    const wrapper = mount(GameScoreboard, {
      props: {
        ...defaultProps,
        player1Fouls: 2,
        player2Fouls: 0,
      },
    })

    expect(wrapper.find('[data-testid="player1-fouls"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="player1-fouls"]').text()).toBe('Fouls: 2')
    expect(wrapper.find('[data-testid="player2-fouls"]').exists()).toBe(false)
  })

  it('hides consecutive fouls when zero', () => {
    const wrapper = mount(GameScoreboard, {
      props: {
        ...defaultProps,
        player1Fouls: 0,
        player2Fouls: 0,
      },
    })

    expect(wrapper.find('[data-testid="player1-fouls"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="player2-fouls"]').exists()).toBe(false)
  })

  it('displays game info (target score, inning, racks)', () => {
    const wrapper = mount(GameScoreboard, {
      props: {
        ...defaultProps,
        targetScore: 150,
        inning: 5,
        racks: 2,
      },
    })

    expect(wrapper.find('[data-testid="target-score"]').text()).toBe('Score: 150')
    expect(wrapper.find('[data-testid="inning"]').text()).toBe('Inning: 5')
    expect(wrapper.find('[data-testid="racks"]').text()).toBe('Racks: 2')
  })

  it('highlights winner when game is complete', () => {
    const wrapper = mount(GameScoreboard, {
      props: {
        ...defaultProps,
        winnerId: 'p1',
      },
    })

    const player1Section = wrapper.find('[data-testid="player1-section"]')
    expect(player1Section.classes()).toContain('ring-success')
  })

  it('updates rack score when balls are made (scenario 2)', () => {
    // Before: rack = 0
    const wrapperBefore = mount(GameScoreboard, { props: defaultProps })
    expect(wrapperBefore.find('[data-testid="player1-rack"]').text()).toBe('0')

    // After: rack = 3
    const wrapperAfter = mount(GameScoreboard, {
      props: { ...defaultProps, player1Rack: 3 },
    })
    expect(wrapperAfter.find('[data-testid="player1-rack"]').text()).toBe('3')
  })

  it('shows negative total score after foul (scenario 3)', () => {
    const wrapper = mount(GameScoreboard, {
      props: {
        ...defaultProps,
        player1Total: -1,
      },
    })

    expect(wrapper.find('[data-testid="player1-total"]').text()).toBe('-1')
  })

  it('keeps rack score after foul, decrements total (scenario 4)', () => {
    const wrapper = mount(GameScoreboard, {
      props: {
        ...defaultProps,
        player1Total: -1,
        player1Rack: 3,
      },
    })

    expect(wrapper.find('[data-testid="player1-total"]').text()).toBe('-1')
    expect(wrapper.find('[data-testid="player1-rack"]').text()).toBe('3')
  })

  it('shows total updated after rerack (scenario 7)', () => {
    const wrapper = mount(GameScoreboard, {
      props: {
        ...defaultProps,
        player1Total: 14,
        player1Rack: 0,
        racks: 1,
      },
    })

    expect(wrapper.find('[data-testid="player1-total"]').text()).toBe('14')
    expect(wrapper.find('[data-testid="player1-rack"]').text()).toBe('0')
    expect(wrapper.find('[data-testid="racks"]').text()).toBe('Racks: 1')
  })
})
