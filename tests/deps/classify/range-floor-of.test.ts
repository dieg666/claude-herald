import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'
import type { Ecosystem } from '../../../types/index.js'

/** A declared range, its floor (undefined for none), and the ecosystem that writes it. */
const FLOORS: readonly (readonly [string, string | undefined, Ecosystem])[] = [
  ['^1.2.3', '1.2.3', 'npm'],
  ['^0.3.1', '0.3.1', 'npm'],
  ['~1.2', '1.2', 'npm'],
  ['>=1.0.0 <2.0.0', '1.0.0', 'npm'],
  ['1.2.x', '1.2', 'npm'],
  ['1.x', '1', 'npm'],
  ['1.2.3 - 2.0.0', '1.2.3', 'npm'],
  ['^1.0.0 || ^2.0.0', '1.0.0', 'npm'],
  ['^2.0.0 || ^1.5.0', '1.5.0', 'npm'],
  ['v1.2.3', 'v1.2.3', 'npm'],
  ['~=1.2', '1.2', 'pypi'],
  ['>=1,<2', '1', 'pypi'],
  ['>=1.2,>=1.5,<2', '1.5', 'pypi'],
  ['==1.*', '1', 'pypi'],
  ['!=1.5,>=1.4', '1.4', 'pypi'],
  ['^1.2', '1.2', 'pypi'],
  ['1.0.2', '1.0.2', 'cargo'],
  ['~> 1.2', '1.2', 'rubygems'],
  ['>= 1.2, < 2', '1.2', 'rubygems'],
  ['^1.2|^2.0', '1.2', 'packagist'],
  ['[1.0,2.0)', '1.0', 'maven'],
  ['[1.0]', '1.0', 'nuget'],
  ['*', undefined, 'npm'],
  ['<2', undefined, 'npm'],
  ['latest', undefined, 'npm'],
  ['(,1.0]', undefined, 'maven'],
  ['dev-main', undefined, 'packagist'],
  ['', undefined, 'npm'],
]

describe('range-floor-of', () => {
  test('a range reduces to the lowest version it accepts', () => {
    for (const [range, floor, ecosystem] of FLOORS) {
      expect(Classify.rangeFloorOf(range, ecosystem), range).toBe(floor)
    }
  })
})
