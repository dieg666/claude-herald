import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Fixtures from '../fixtures'

describe('unique-id-of', () => {
  test('lowercase ASCII letters and digits joined by dashes, accents folded', () => {
    expect(Commands.uniqueIdOf("Simon Willison's Weblog", [])).toBe('simon-willison-s-weblog')
    expect(Commands.uniqueIdOf('  Noticias de España!  ', [])).toBe('noticias-de-espana')
  })

  test('a name with no letter or digit becomes source', () => {
    expect(Commands.uniqueIdOf('日本語 ★', [])).toBe('source')
  })

  test('a taken id gets the first free -2, -3, ...; the saved tab id is always taken', () => {
    const sources = [Fixtures.sourceAt('blog'), Fixtures.sourceAt('blog-2')]

    expect(Commands.uniqueIdOf('Blog', sources)).toBe('blog-3')
    expect(Commands.uniqueIdOf('Saved', [])).toBe('saved-2')
  })

  test('long names are cut to 40 characters without a trailing dash', () => {
    const id = Commands.uniqueIdOf(`${'a'.repeat(39)} tail`, [])

    expect(id).toBe('a'.repeat(39))
  })
})
