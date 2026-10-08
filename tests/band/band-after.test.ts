import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('band-after', () => {
  const RUNNING = { offset: 0, selected: 0, isPaused: false }

  test('next and prev turn three items at a time, wrap at both ends, and pause', () => {
    expect(Band.bandAfter(RUNNING, 'next', 7)).toEqual({ offset: 3, selected: 0, isPaused: true })
    expect(Band.bandAfter({ ...RUNNING, offset: 6 }, 'next', 7)).toEqual({
      offset: 0,
      selected: 0,
      isPaused: true,
    })
    expect(Band.bandAfter(RUNNING, 'prev', 7)).toEqual({ offset: 6, selected: 0, isPaused: true })
    expect(Band.bandAfter({ ...RUNNING, offset: 3 }, 'prev', 6)).toEqual({
      offset: 0,
      selected: 0,
      isPaused: true,
    })
  })

  test('the timer turns the page while running, keeping it running', () => {
    expect(Band.bandAfter({ ...RUNNING, selected: 2 }, 'rotate', 4)).toEqual({
      offset: 3,
      selected: 0,
      isPaused: false,
    })
    expect(Band.bandAfter({ ...RUNNING, offset: 3 }, 'rotate', 4)).toEqual(RUNNING)
  })

  test('the timer changes nothing while paused or with three items or fewer', () => {
    const paused = { offset: 3, selected: 1, isPaused: true }

    expect(Band.bandAfter(paused, 'rotate', 9)).toEqual(paused)

    for (const total of [0, 1, 2, 3]) {
      expect(Band.bandAfter(RUNNING, 'rotate', total)).toEqual(RUNNING)
    }
  })

  test('auto toggles the pause, page and selection kept', () => {
    const paused = { offset: 3, selected: 1, isPaused: true }

    expect(Band.bandAfter(paused, 'auto', 9)).toEqual({ ...paused, isPaused: false })
    expect(Band.bandAfter({ ...paused, isPaused: false }, 'auto', 9)).toEqual(paused)
  })

  test('up and down move the selection within the page, wrapping, and pause', () => {
    expect(Band.bandAfter(RUNNING, 'down', 7)).toEqual({ offset: 0, selected: 1, isPaused: true })
    expect(Band.bandAfter({ ...RUNNING, selected: 2 }, 'down', 7)).toEqual({
      offset: 0,
      selected: 0,
      isPaused: true,
    })
    expect(Band.bandAfter(RUNNING, 'up', 7)).toEqual({ offset: 0, selected: 2, isPaused: true })
    expect(Band.bandAfter({ ...RUNNING, offset: 6 }, 'up', 7)).toEqual({
      offset: 6,
      selected: 0,
      isPaused: true,
    })
  })

  test('a list that shrank brings the page and selection back inside it first', () => {
    const far = { offset: 9, selected: 2, isPaused: true }

    expect(Band.bandAfter(far, 'rotate', 5)).toEqual({ offset: 3, selected: 1, isPaused: true })
    expect(Band.bandAfter(far, 'next', 5)).toEqual({ offset: 0, selected: 0, isPaused: true })
    expect(Band.bandAfter(far, 'down', 4)).toEqual({ offset: 3, selected: 0, isPaused: true })
    expect(Band.bandAfter(far, 'rotate', 0)).toEqual({ offset: 0, selected: 0, isPaused: true })
  })

  test('a bad stored offset or selection reads as the first', () => {
    for (const band of [
      { offset: -3, selected: -1, isPaused: true },
      { offset: 1.5, selected: 0.5, isPaused: true },
      { offset: Number.NaN, selected: Number.NaN, isPaused: true },
    ]) {
      expect(Band.bandAfter(band, 'rotate', 9)).toEqual({ offset: 0, selected: 0, isPaused: true })
    }

    expect(Band.bandAfter({ offset: 4, selected: 0, isPaused: true }, 'rotate', 9)).toEqual({
      offset: 3,
      selected: 0,
      isPaused: true,
    })
  })
  test('over pages of one, next, prev and the timer move one item, wrapping at both ends', () => {
    expect(Band.bandAfter(RUNNING, 'next', 7, 1)).toEqual({
      offset: 1,
      selected: 0,
      isPaused: true,
    })
    expect(Band.bandAfter({ ...RUNNING, offset: 6 }, 'next', 7, 1)).toEqual({
      offset: 0,
      selected: 0,
      isPaused: true,
    })
    expect(Band.bandAfter(RUNNING, 'prev', 7, 1)).toEqual({
      offset: 6,
      selected: 0,
      isPaused: true,
    })
    expect(Band.bandAfter({ ...RUNNING, offset: 4 }, 'rotate', 7, 1)).toEqual({
      offset: 5,
      selected: 0,
      isPaused: false,
    })
    expect(Band.bandAfter(RUNNING, 'rotate', 1, 1)).toEqual(RUNNING)
  })

  test('a three-item page read over pages of one starts at its first item, and the reverse at the page holding it', () => {
    expect(Band.bandAfter({ offset: 3, selected: 2, isPaused: true }, 'rotate', 7, 1)).toEqual({
      offset: 3,
      selected: 0,
      isPaused: true,
    })
    expect(Band.bandAfter({ offset: 4, selected: 0, isPaused: true }, 'rotate', 7)).toEqual({
      offset: 3,
      selected: 0,
      isPaused: true,
    })
  })
})
