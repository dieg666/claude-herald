import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'

describe('parse-yaml', () => {
  test('block mappings and sequences, quoted keys, scalars kept as text', () => {
    const [document] = Detect.parseYaml(
      [
        'packages:',
        "  - 'packages/*'",
        '  - "!**/test/**"  # not these',
        'importers:',
        '  .:',
        '    dependencies:',
        "      '@babel/parser':",
        '        specifier: ^7.29.8',
        '        version: 7.29.8',
        '      lru-cache: 10.10',
        'empty:',
        'nothing: ~',
      ].join('\n'),
    )

    expect(document).toEqual({
      packages: ['packages/*', '!**/test/**'],
      importers: {
        '.': {
          dependencies: {
            '@babel/parser': { specifier: '^7.29.8', version: '7.29.8' },
            'lru-cache': '10.10',
          },
        },
      },
      empty: null,
      nothing: null,
    })
  })

  test('flow collections, block scalars, maps inside sequences, sequences at the key indentation', () => {
    const [document] = Detect.parseYaml(
      [
        'resolution: {integrity: sha512-x==, tarball: "a, b"}',
        'cpu: [arm64, x64]',
        'description: >-',
        '  first line',
        '  second line',
        'list:',
        '- name: a',
        '  path: ./a',
        '- b',
      ].join('\n'),
    )

    expect(document).toEqual({
      resolution: { integrity: 'sha512-x==', tarball: 'a, b' },
      cpu: ['arm64', 'x64'],
      description: 'first line second line',
      list: [{ name: 'a', path: './a' }, 'b'],
    })
  })

  test('several documents, each its own value', () => {
    expect(Detect.parseYaml('---\na: 1\n---\nb: 2\n')).toEqual([{ a: '1' }, { b: '2' }])
  })

  test('throws on tabs, stray indentation and unterminated flow collections', () => {
    expect(() => Detect.parseYaml('a:\n\tb: 1')).toThrow('tab indentation')
    expect(() => Detect.parseYaml('a: 1\n  b: 2')).toThrow('unexpected indentation')
    expect(() => Detect.parseYaml('a: {b: 1')).toThrow('unterminated flow collection')
  })
})
