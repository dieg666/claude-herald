import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'

describe('parse-toml', () => {
  test('tables, dotted and quoted keys, arrays of tables', () => {
    const toml = Detect.parseToml(
      [
        'title = "x" # comment',
        'edition.workspace = true',
        "[target.'cfg(unix)'.dependencies.libc]",
        'version = "0.2"',
        '[[package]]',
        'name = "a"',
        '[[package]]',
        'name = "b"',
        '[package.metadata]',
        'k = 1',
      ].join('\n'),
    )

    expect(toml).toEqual({
      title: 'x',
      edition: { workspace: true },
      target: { 'cfg(unix)': { dependencies: { libc: { version: '0.2' } } } },
      package: [{ name: 'a' }, { name: 'b', metadata: { k: 1 } }],
    })
  })

  test('strings: escapes, literal, multi-line basic with line-ending backslash, multi-line literal', () => {
    const toml = Detect.parseToml(
      [
        'a = "tab\\there \\u00e9"',
        "b = 'C:\\path'",
        'c = """',
        'one \\',
        '   two"""',
        "d = '''",
        "raw \\n'''",
      ].join('\n'),
    )

    expect(toml).toEqual({ a: 'tab\there é', b: 'C:\\path', c: 'one two', d: 'raw \\n' })
  })

  test('arrays over lines with comments and trailing commas, inline tables, dates as text', () => {
    const toml = Detect.parseToml(
      [
        'deps = [',
        '  "a>=1", # first',
        '  { include-group = "dev" },',
        ']',
        'spec = { version = "1", features = ["x"] }',
        'when = 1979-05-27T07:32:00Z',
      ].join('\n'),
    )

    expect(toml).toEqual({
      deps: ['a>=1', { 'include-group': 'dev' }],
      spec: { version: '1', features: ['x'] },
      when: '1979-05-27T07:32:00Z',
    })
  })

  test('throws on what it cannot read, naming the line', () => {
    expect(() => Detect.parseToml('[dependencies\nx = "1"')).toThrow('TOML line 1')
    expect(() => Detect.parseToml('a = "open\nb = 1')).toThrow('newline in a string')
    expect(() => Detect.parseToml('a = nope')).toThrow("unexpected value 'nope'")
    expect(() => Detect.parseToml('a = 1 b = 2')).toThrow("unexpected 'b'")
  })
})
