import { describe, expect, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'
import Fixtures from '../fixtures'

describe('copy-text-of', () => {
  test('fills {title}, {url} and {source}, every time each appears', () => {
    expect(
      Actions.copyTextOf('{source}: {title} ({url}) {title}', Fixtures.itemAt('a'), 'Feed'),
    ).toBe('Feed: a (https://example.com/a) a')
  })

  test('feed text becomes one line: line breaks and control characters gone', () => {
    const item = { ...Fixtures.itemAt('a'), title: 'Big\nnews\u0007 ‮again\r\n' }

    expect(Actions.copyTextOf('Read: {title}', item, 'Feed\nName')).toBe('Read: Big news again')
    expect(Actions.copyTextOf('{source}', item, 'Feed\nName')).toBe('Feed Name')
  })

  test('a placeholder inside a title is not filled again', () => {
    const item = { ...Fixtures.itemAt('a'), title: 'about {url} and {source}' }

    expect(Actions.copyTextOf('{title} {url}', item, 'Feed')).toBe(
      'about {url} and {source} https://example.com/a',
    )
  })

  test('the template keeps its own lines and any other braces', () => {
    expect(Actions.copyTextOf('{title}\n{other} {url}', Fixtures.itemAt('a'), 'Feed')).toBe(
      'a\n{other} https://example.com/a',
    )
  })
})
