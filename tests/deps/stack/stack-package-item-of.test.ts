import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-package-item-of', () => {
  const packageOf = (name: string) =>
    Stack.stackPackagesOf(Fixtures.STACK_MIDDLE).find(pkg => pkg.name === name)!

  test("a package's item is its target release, a 3.25.0 backport dated later ignored, with the count and the release that is breaking", () => {
    const item = Stack.stackPackageItemOf(packageOf('zod'))

    expect(item.release.version).toBe('4.6.5')
    expect(item.release.current).toBe('3.23.8')
    expect(item.publishedAt).toBe('2026-09-13T00:00:00Z')
    expect(item.id).toBe(packageOf('zod').target.id)
    expect(item.release.breaking).toBe(false)
    expect(item.rollup).toEqual({ releases: 4, breakingIn: '4.6.3' })
  })

  test('a release shown with no other release of its package is returned as it is', () => {
    const ky = packageOf('ky')

    expect(Stack.stackPackageItemOf(ky)).toBe(ky.target)
    expect(Stack.stackPackageItemOf(ky).rollup).toBeUndefined()
  })

  test('unflagged releases only count; a flag the target carries itself is not named', () => {
    expect(Stack.stackPackageItemOf(packageOf('vite')).rollup).toEqual({ releases: 2 })

    const own = Stack.stackPackagesOf([
      Fixtures.stackItemAt('pkg', '2.0.0', { security: true }),
      Fixtures.stackItemAt('pkg', '1.9.0'),
    ])[0]!

    expect(Stack.stackPackageItemOf(own).rollup).toEqual({ releases: 2 })
  })

  test('the oldest release that carries a flag is the one named, as in the stack tab', () => {
    const [pkg] = Stack.stackPackagesOf([
      Fixtures.stackItemAt('pkg', '3.0.0'),
      Fixtures.stackItemAt('pkg', '2.0.0', { security: true }),
      Fixtures.stackItemAt('pkg', '1.5.0', { security: true }),
    ])

    expect(Stack.stackPackageItemOf(pkg!).rollup).toEqual({ releases: 3, securityIn: '1.5.0' })
  })
})
