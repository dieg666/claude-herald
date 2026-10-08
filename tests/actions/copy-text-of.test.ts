import { describe, expect, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'
import Defaults from '../../hooks/defaults'
import Fixtures from '../fixtures'

describe('copy-text-of', () => {
  test('fills {title}, {url} and {source}, every time each appears', () => {
    expect(
      Actions.copyTextOf('{source}: {title} ({url}) {title}', Fixtures.itemAt('a'), 'Feed'),
    ).toBe('Feed: a (https://example.com/a) a')
  })

  test('the default template names the source of a release and of a news item', () => {
    const template = Defaults.DEFAULT_SETTINGS.template
    const release = { ...Fixtures.itemAt('a'), title: 'v2.1.293' }
    const news = { ...Fixtures.itemAt('b'), title: 'Claude gets a new model' }

    expect(Actions.copyTextOf(template, release, 'Claude Code')).toBe(
      'Read this and tell me whether it affects this project: Claude Code v2.1.293 https://example.com/a',
    )
    expect(Actions.copyTextOf(template, news, 'Anthropic news')).toBe(
      'Read this and tell me whether it affects this project: Anthropic news Claude gets a new model https://example.com/b',
    )
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
