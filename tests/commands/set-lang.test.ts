import { describe, expect, test } from 'claude-code/testing'

import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'

describe('set-lang', () => {
  const SUMMARIES = [
    {
      itemId: 'src:a',
      lang: 'es',
      kind: 'short',
      version: Summaries.SUMMARY_PROMPT_VERSION,
      text: 'corto',
    },
    {
      itemId: 'src:a',
      lang: 'pt-BR',
      kind: 'short',
      version: Summaries.SUMMARY_PROMPT_VERSION,
      text: 'curto',
    },
    {
      itemId: 'src:a',
      lang: 'feed',
      kind: 'short',
      version: Summaries.SUMMARY_PROMPT_VERSION,
      text: 'short',
    },
  ]

  const peeked = (text: string | undefined) =>
    JSON.parse(text ?? 'null') as { settings: { lang: string }; summaries: unknown }

  test(
    'a language code is saved, mirrored, and the summaries in it mirrored too',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on, { summaries: SUMMARIES })

      expect((await $.command.run(Fixtures.heraldOf('lang ES'))).text).toBe(
        'Summaries are written in es.',
      )
      expect(stored.get('settings')).toMatchObject({ lang: 'es' })
      expect(peeked((await $.command.run(Fixtures.PEEK)).text)).toMatchObject({
        settings: { lang: 'es' },
        summaries: { 'src:a': 'corto' },
      })

      await $.command.run(Fixtures.heraldOf('lang PT-BR'))

      expect(stored.get('settings')).toMatchObject({ lang: 'pt-BR' })
      expect(peeked((await $.command.run(Fixtures.PEEK)).text).summaries).toEqual({
        'src:a': 'curto',
      })
    },
  )

  test(
    "feed and user are saved as such; user follows Claude Code's language",
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on, { summaries: SUMMARIES })

      on('settings.read', () => ({ value: { language: 'es' } }))

      expect((await $.command.run(Fixtures.heraldOf('lang User'))).text).toBe(
        "Summaries are written in Claude Code's language setting (each item's own while it is unset).",
      )
      expect(stored.get('settings')).toMatchObject({ lang: 'user' })
      expect(peeked((await $.command.run(Fixtures.PEEK)).text).summaries).toEqual({
        'src:a': 'corto',
      })

      expect((await $.command.run(Fixtures.heraldOf('lang feed'))).text).toBe(
        "Summaries are written in each item's own language.",
      )
      expect(stored.get('settings')).toMatchObject({ lang: 'feed' })
    },
  )

  test('refuses anything else, saving nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on)

    for (const value of ['english', 'e', 'es_ES', 'es-', 'es-x', '"es es"', 'zh-Hans-CN']) {
      const { text } = await $.command.run(Fixtures.heraldOf(`lang ${value}`))

      expect(text).toMatch(/^The summary language is feed .* is none of them\.$/)
    }

    expect(stored.has('settings')).toBe(false)
  })
})
