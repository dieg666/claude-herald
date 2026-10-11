import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('herald-args-of', () => {
  test('a command without a slash is what it asks, line breaks kept', () => {
    expect(Commands.heraldArgsOf('add https://a.example/x.xml "A news"')).toBe(
      'add https://a.example/x.xml "A news"',
    )
    expect(Commands.heraldArgsOf('template A\n{title}')).toBe('template A\n{title}')
  })

  test('a leading /herald, in any case, is dropped with the spaces and breaks after it', () => {
    expect(Commands.heraldArgsOf('/herald disable Hacker News')).toBe('disable Hacker News')
    expect(Commands.heraldArgsOf('/HERALD\tlist')).toBe('list')
    expect(Commands.heraldArgsOf('/herald\ndisable two')).toBe('disable two')
    expect(Commands.heraldArgsOf('/Herald')).toBe('')
  })

  test('only the first /herald is dropped', () => {
    expect(Commands.heraldArgsOf('/herald /herald list')).toBe('/herald list')
  })

  test('another slash command, or a longer name starting with /herald, is not a /herald command', () => {
    expect(Commands.heraldArgsOf('/help')).toBeUndefined()
    expect(Commands.heraldArgsOf('/compact keep the plan')).toBeUndefined()
    expect(Commands.heraldArgsOf('/heraldry list')).toBeUndefined()
  })
})
