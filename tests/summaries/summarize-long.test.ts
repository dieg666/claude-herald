import { describe, expect, test } from 'claude-code/testing'

import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'

describe('summarize-long', () => {
  const ITEM = Fixtures.itemAt('a')

  test('returns 3 to 5 lines in the current language, cached under long', async () => {
    const { host, replies, asked, stored, state } = Fixtures.fakeHostOf({
      settings: { lang: 'es' },
    })
    const jobs = Summaries.summaryJobsOf()

    replies.push(Fixtures.answerOf('- Uno.\n- Dos.\n- Tres.\n- Cuatro.\n- Cinco.\n- Seis.'))

    const text = await Summaries.summarizeLong(host, jobs, ITEM)
    const lines = (text ?? '').split('\n')

    expect(lines).toEqual(['Uno.', 'Dos.', 'Tres.', 'Cuatro.', 'Cinco.'])
    expect(asked[0]?.request.system).toContain('Write 3 to 5 lines')
    expect(stored.get('summaries')).toEqual([
      {
        itemId: ITEM.id,
        lang: 'es',
        kind: 'long',
        version: Summaries.SUMMARY_PROMPT_VERSION,
        text,
      },
    ])
    expect(state.summaries).toEqual({})

    expect(await Summaries.summarizeLong(host, jobs, ITEM)).toBe(text)
    expect(asked.length).toBe(1)
  })

  test('a paragraph reply comes back as lines', async () => {
    const { host, replies } = Fixtures.fakeHostOf()

    replies.push(Fixtures.answerOf('First. Second. Third. Fourth.'))

    expect(await Summaries.summarizeLong(host, Summaries.summaryJobsOf(), ITEM)).toBe(
      'First.\nSecond.\nThird.\nFourth.',
    )
  })

  test('no answer gives nothing and is not cached', async () => {
    const { host, replies, stored } = Fixtures.fakeHostOf()

    replies.push(Fixtures.unansweredOf('aborted'))

    expect(await Summaries.summarizeLong(host, Summaries.summaryJobsOf(), ITEM)).toBeUndefined()
    expect(stored.get('summaries')).toBeUndefined()
  })

  test('an item without usable text gives nothing, with no model call', async () => {
    const { host, asked } = Fixtures.fakeHostOf()

    expect(
      await Summaries.summarizeLong(host, Summaries.summaryJobsOf(), { ...ITEM, text: '' }),
    ).toBeUndefined()
    expect(asked).toEqual([])
  })
})
