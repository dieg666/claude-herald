import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('set-deps-filter', () => {
  const peeked = (text: string | undefined) =>
    JSON.parse(text ?? 'null') as {
      stack: { root: string; filter: string }
      pane: { selected: number } | null
    }

  test(
    "sets the stack tab's filter for this project, the selection back at the top; nothing clears it",
    { plugins: [Fixtures.STACK_PEEK] },
    async ($, on) => {
      Fixtures.storeOn(on, { sources: [] })
      Fixtures.fsOn(on, { '.git': { isDir: true } })

      expect((await $.command.run(Fixtures.newsOf('deps filter "react  major"'))).text).toBe(
        'The stack tab shows the releases matching "react  major".',
      )

      const set = peeked((await $.command.run(Fixtures.PEEK_STACK)).text)

      expect(set.stack).toMatchObject({ root: '/repo', filter: 'react  major' })
      expect(set.pane?.selected).toBe(0)

      expect((await $.command.run(Fixtures.newsOf('deps filter'))).text).toBe(
        'The stack tab shows every release again.',
      )
      expect(peeked((await $.command.run(Fixtures.PEEK_STACK)).text).stack.filter).toBe('')
    },
  )

  test(
    'a filter over 100 characters is refused with the usage line',
    { plugins: [Fixtures.STACK_PEEK] },
    async ($, on) => {
      Fixtures.storeOn(on, { sources: [] })
      Fixtures.fsOn(on, { '.git': { isDir: true } })

      expect((await $.command.run(Fixtures.newsOf(`deps filter ${'x'.repeat(101)}`))).text).toBe(
        'The filter is 101 characters; the most is 100.\nUsage: /news deps filter [text]',
      )
      expect(peeked((await $.command.run(Fixtures.PEEK_STACK)).text).stack).toBeNull()
    },
  )
})
