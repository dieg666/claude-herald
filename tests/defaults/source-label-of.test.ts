import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Defaults from '../../hooks/defaults'
import Fixtures from '../fixtures'

describe('source-label-of', () => {
  test('every factory source keeps a band label of at most twelve cells, the short label where it has one', () => {
    expect(
      Defaults.FACTORY_SOURCES.map(source => [source.name, Defaults.sourceLabelOf(source)]),
    ).toEqual([
      ['Anthropic news', 'Anthropic'],
      ['Claude Code releases', 'Claude Code'],
      ['Claude Agent SDK (TS)', 'Agent SDK'],
      ['Anthropic Python SDK', 'Python SDK'],
      ['MCP spec', 'MCP spec'],
      ['Claude status', 'Status'],
      ['Hacker News', 'Hacker News'],
      ['Simon Willison', 'Willison'],
      ['AINews (smol.ai)', 'AINews'],
      ['GitHub changelog', 'GitHub'],
    ])
    expect(
      Defaults.FACTORY_SOURCES.filter(
        source => Band.displayWidthOf(Defaults.sourceLabelOf(source)) > Band.SOURCE_COLUMNS,
      ),
    ).toEqual([])
  })

  test('a renamed factory source keeps the name it was given', () => {
    expect(Defaults.sourceLabelOf({ id: 'claude-code-releases', name: 'CC releases' })).toBe(
      'CC releases',
    )
  })

  test('a user source keeps its name, even with a factory id-like name; a gone source has none', () => {
    expect(
      Defaults.sourceLabelOf(Fixtures.sourceAt('mine', { name: 'Claude Code releases' })),
    ).toBe('Claude Code releases')
    expect(Defaults.sourceLabelOf(undefined)).toBe('')
  })
})
