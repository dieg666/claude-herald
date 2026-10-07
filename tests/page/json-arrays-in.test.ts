import { describe, expect, test } from 'claude-code/testing'

import Page from '../../hooks/page'

const arraysIn = (reply: string) => [...Page.jsonArraysIn(reply)]

describe('json-arrays-in', () => {
  test('a bare array is found', () => {
    expect(arraysIn('[1, 2]')).toEqual([[1, 2]])
  })

  test('arrays in a fence or between sentences are found in order', () => {
    expect(arraysIn('Here:\n```json\n[{"a": 1}]\n```\nand also [2] done')).toEqual([
      [{ a: 1 }],
      [2],
    ])
  })

  test('brackets inside strings do not end an array', () => {
    expect(arraysIn('x [{"t": "a ] b [ \\" c"}] y')).toEqual([[{ t: 'a ] b [ " c' }]])
  })

  test('an object is read whole and gives its array only when it wraps exactly one', () => {
    expect(arraysIn('{"items": [1]}')).toEqual([[1]])
    expect(arraysIn('{"n": 1, "items": [1]}')).toEqual([[1]])
    expect(arraysIn('{"a": [1], "b": [2]}')).toEqual([])
    expect(arraysIn('{"a": {"b": [1]}}')).toEqual([])
    expect(arraysIn('{"a": 1}')).toEqual([])
  })

  test('a trailing comma is tolerated', () => {
    expect(arraysIn('[{"a": 1,},]')).toEqual([[{ a: 1 }]])
    expect(arraysIn('["a,]", ]')).toEqual([['a,]']])
  })

  test('text that is not JSON gives nothing and stops', { timeoutMs: 30_000 }, () => {
    expect(arraysIn('no json here')).toEqual([])
    expect(arraysIn('[[[[')).toEqual([])
    expect(arraysIn('[1, 2')).toEqual([])
    expect(arraysIn('[unquoted]')).toEqual([])
    expect(arraysIn('['.repeat(60_000))).toEqual([])
  })
})
