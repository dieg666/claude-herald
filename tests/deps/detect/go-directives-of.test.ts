import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'

describe('go-directives-of', () => {
  test('single-line directives and blocks unfold to one verb per line, comments kept', () => {
    const text = [
      'module example.com/app',
      '',
      'go 1.22',
      '',
      'require (',
      '\t// tools',
      '\tgithub.com/spf13/cobra v1.8.0',
      '\tgolang.org/x/sys v0.20.0 // indirect',
      ')',
      '',
      'replace example.com/lib => ../lib',
    ].join('\n')

    expect(Detect.goDirectivesOf(text)).toEqual([
      { verb: 'module', line: 'example.com/app' },
      { verb: 'go', line: '1.22' },
      { verb: 'require', line: 'github.com/spf13/cobra v1.8.0' },
      { verb: 'require', line: 'golang.org/x/sys v0.20.0 // indirect' },
      { verb: 'replace', line: 'example.com/lib => ../lib' },
    ])
  })

  test('go.work use blocks read the same way', () => {
    expect(Detect.goDirectivesOf('go 1.22\r\n\r\nuse (\r\n\t./api\r\n\t./web\r\n)\r\n')).toEqual([
      { verb: 'go', line: '1.22' },
      { verb: 'use', line: './api' },
      { verb: 'use', line: './web' },
    ])
  })

  test('a block left open throws', () => {
    expect(() => Detect.goDirectivesOf('module x\nrequire (\n\ta v1.0.0\n')).toThrow(
      'unterminated require block',
    )
  })
})
