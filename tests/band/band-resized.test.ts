import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('band-resized', () => {
  const ITEMS = Fixtures.datedItemsOf('src', 12)

  test('the selected item stays selected, on the page of the new size that holds it; pause kept', () => {
    // Item 8 (index 7): third on the third page of three.
    const band = { offset: 6, selected: 1, isPaused: true }

    expect(Band.bandResized(band, ITEMS, ITEMS, 5)).toEqual({
      offset: 5,
      selected: 2,
      isPaused: true,
    })
    expect(Band.bandResized(band, ITEMS, ITEMS, 1)).toEqual({
      offset: 7,
      selected: 0,
      isPaused: true,
    })
    expect(Band.bandResized({ ...band, isPaused: false }, ITEMS, ITEMS, 9)).toEqual({
      offset: 0,
      selected: 7,
      isPaused: false,
    })
  })

  test('paused on the last item, a larger page keeps it selected on the last page', () => {
    const band = { offset: 9, selected: 2, isPaused: true }

    expect(Band.bandResized(band, ITEMS, ITEMS, 5)).toEqual({
      offset: 10,
      selected: 1,
      isPaused: true,
    })
  })

  test('an item the new size moves is followed to its new place', () => {
    const after = [ITEMS[7], ...ITEMS.slice(0, 7), ...ITEMS.slice(8)].filter(
      item => item !== undefined,
    )

    expect(Band.bandResized({ offset: 6, selected: 1, isPaused: false }, ITEMS, after, 5)).toEqual({
      offset: 0,
      selected: 0,
      isPaused: false,
    })
  })

  test('a state past the end, or a bad one, comes back inside; an empty list starts at the top', () => {
    expect(Band.bandResized({ offset: 30, selected: 2, isPaused: false }, ITEMS, ITEMS, 5)).toEqual(
      { offset: 10, selected: 1, isPaused: false },
    )
    expect(
      Band.bandResized({ offset: -3, selected: Number.NaN, isPaused: false }, ITEMS, ITEMS, 5),
    ).toEqual({ offset: 0, selected: 0, isPaused: false })
    expect(Band.bandResized({ offset: 6, selected: 1, isPaused: true }, [], [], 5)).toEqual({
      offset: 0,
      selected: 0,
      isPaused: true,
    })
  })

  test('an item gone from the list after leaves the selection at the nearest place', () => {
    const after = ITEMS.slice(0, 4)

    expect(Band.bandResized({ offset: 6, selected: 1, isPaused: false }, ITEMS, after, 3)).toEqual({
      offset: 3,
      selected: 0,
      isPaused: false,
    })
  })
})
