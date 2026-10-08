import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-headline-of', () => {
  test('current → new without the package, then the release title when it says more than the version', () => {
    const [react, vite] = Fixtures.STACK_SAMPLE

    expect(Stack.stackHeadlineOf(react!)).toBe('18.2.0 → 19.0.0 · React 19')
    expect(Stack.stackHeadlineOf(vite!)).toBe('5.0.0 → 5.1.0')
    expect(Stack.stackHeadlineOf(Fixtures.stackItemAt('a', '2.0.0', { title: '2.0.0' }))).toBe(
      '→ 2.0.0',
    )
  })

  test('a title that is the package at the version, scoped or not, with or without v, says no more and is dropped', () => {
    const titled = (name: string, title: string) =>
      Stack.stackHeadlineOf(Fixtures.stackItemAt(name, '11.1.7', { current: '9.5.5', title }))

    expect(titled('astro', 'astro@11.1.7')).toBe('9.5.5 → 11.1.7')
    expect(titled('astro', 'astro@v11.1.7')).toBe('9.5.5 → 11.1.7')
    expect(titled('@astrojs/node', '@astrojs/node@11.1.7')).toBe('9.5.5 → 11.1.7')
    expect(titled('@astrojs/node', ' @astrojs/node@11.1.7\n')).toBe('9.5.5 → 11.1.7')
  })

  test('a title naming another package, or another version, is kept', () => {
    const titled = (name: string, title: string) =>
      Stack.stackHeadlineOf(Fixtures.stackItemAt(name, '11.1.7', { current: '9.5.5', title }))

    expect(titled('@astrojs/node', '@astrojs/vercel@11.1.7')).toBe(
      '9.5.5 → 11.1.7 · @astrojs/vercel@11.1.7',
    )
    expect(titled('astro', 'create-astro@11.1.7')).toBe('9.5.5 → 11.1.7 · create-astro@11.1.7')
    expect(titled('astro', 'astro@11.1.6')).toBe('9.5.5 → 11.1.7 · astro@11.1.6')
  })

  test('a release that names no version shows its title alone', () => {
    const item = Fixtures.stackItemAt('a', '1.0.0', { title: 'Nightly build' })
    const { version, ...release } = item.release

    expect(version).toBe('1.0.0')
    expect(Stack.stackHeadlineOf({ ...item, release })).toBe('Nightly build')
  })

  test('untrusted line breaks stay on one line', () => {
    const item = Fixtures.stackItemAt('a', '2.0.0', { current: '1\n0', title: 'x\ny' })

    expect(Stack.stackHeadlineOf(item)).not.toMatch(/\n/)
  })
})
