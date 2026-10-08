import { describe, expect, test } from 'claude-code/testing'

import type { StackProgress } from '../../types/index.js'
import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('stack-state-line-of', () => {
  const SETTINGS = { isEnabled: true, includeDev: false, showLevel: 'minor+' as const }
  const DONE: StackProgress = {
    isDetected: true,
    manifests: 2,
    detected: 4,
    followed: 4,
    checked: 4,
    unresolved: 0,
  }

  const lineOf = (progress: Partial<StackProgress> | undefined, fields: object = {}) =>
    Pane.stackStateLineOf({
      items: [],
      filter: '',
      expanded: [],
      settings: SETTINGS,
      ...(progress === undefined ? {} : { progress: { ...DONE, ...progress } }),
      ...fields,
    })

  test('a filter that matches no package says so and how to see them all', () => {
    expect(lineOf({}, { items: Fixtures.STACK_SAMPLE, filter: ' zz\nz ' })).toBe(
      'No package matches "zz z". Clear the filter to see all.',
    )
  })

  test('a filter over a stack with no release says why the stack is empty instead', () => {
    expect(lineOf({}, { filter: 'zzz' })).toBe('Everything in your stack is up to date.')
  })

  test('the stack turned off says the command that turns it on', () => {
    expect(lineOf({}, { settings: { ...SETTINGS, isEnabled: false } })).toBe(
      'Your stack is off in this project. /herald deps on turns it on.',
    )
  })

  test('before the first detection it is looking for manifests', () => {
    expect(lineOf(undefined)).toBe("Looking for this project's package manifests…")
    expect(lineOf({ isDetected: false })).toBe("Looking for this project's package manifests…")
  })

  test('no manifest, manifests with runtime dependencies left out, or none at all', () => {
    expect(lineOf({ manifests: 0, detected: 0, followed: 0, checked: 0 })).toBe(
      'No package manifests found in this project.',
    )
    expect(lineOf({ manifests: 1, detected: 3, followed: 0, checked: 0 })).toBe(
      'No runtime dependencies to follow. /herald deps dev on follows dev ones too.',
    )
    expect(
      lineOf(
        { manifests: 1, detected: 3, followed: 0, checked: 0 },
        { settings: { ...SETTINGS, includeDev: true } },
      ),
    ).toBe("No dependencies found in this project's manifests.")
    expect(lineOf({ manifests: 1, detected: 0, followed: 0, checked: 0 })).toBe(
      "No dependencies found in this project's manifests.",
    )
  })

  test('while some packages are still being looked up it says how far it got', () => {
    expect(lineOf({ checked: 1, unresolved: 1 })).toBe(
      "Checking your stack's releases: 2 of 4 packages so far…",
    )
  })

  test('no package with a release feed says how to map one', () => {
    expect(lineOf({ checked: 0, unresolved: 4 })).toBe(
      'No release feed found for any of your 4 packages. /herald deps map <package> <owner/repo> sets one.',
    )
    expect(lineOf({ followed: 1, checked: 0, unresolved: 1 })).toBe(
      'No release feed found for your package. /herald deps map <package> <owner/repo> sets one.',
    )
  })

  test('releases the show level hides say how to show them', () => {
    expect(lineOf({}, { hidden: 2 })).toBe(
      'No release at the minor+ level. /herald deps level all shows every release.',
    )
  })

  test('everything looked at and nothing new is up to date, the packages without a feed counted', () => {
    expect(lineOf({})).toBe('Everything in your stack is up to date.')
    expect(lineOf({ checked: 3, unresolved: 1 })).toBe(
      'Everything in your stack is up to date · 1 without a release feed, listed by /herald deps.',
    )
  })
})
