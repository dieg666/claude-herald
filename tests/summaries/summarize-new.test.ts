import { describe, expect, test } from 'claude-code/testing'

import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'

describe('summarize-new', () => {
  test('no new items, as on a first load, makes no call', async () => {
    const { host, asked, sets } = Fixtures.fakeHostOf({ settings: Fixtures.SUMMARIES_ON })

    await Summaries.summarizeNew(host, Summaries.summaryJobsOf(), [])

    expect(asked).toEqual([])
    expect(sets).toEqual([])
  })

  test('one new item makes exactly one request, with the signal, into the cache and state', async () => {
    const { host, asked, replies, state } = Fixtures.fakeHostOf({ settings: Fixtures.SUMMARIES_ON })
    const controller = new AbortController()

    replies.push(Fixtures.answerOf('New.'))
    await Summaries.summarizeNew(
      host,
      Summaries.summaryJobsOf(),
      [Fixtures.itemAt('a')],
      controller.signal,
    )

    expect(asked.length).toBe(1)
    expect(asked[0]?.signal).toBe(controller.signal)
    expect(state.summaries).toEqual({ 'src:a': 'New.' })
  })

  test('with automatic summaries off, new items make no call and nothing is written', async () => {
    const { host, asked, replies, sets, state } = Fixtures.fakeHostOf({ settings: { lang: 'es' } })

    replies.push(Fixtures.answerOf('New.'))
    await Summaries.summarizeNew(host, Summaries.summaryJobsOf(), [
      Fixtures.itemAt('a'),
      Fixtures.itemAt('b'),
    ])

    expect(asked).toEqual([])
    expect(sets).toEqual([])
    expect(state.summaries).toEqual({})
  })

  test('a run with many new items summarizes the newest few only', async () => {
    const items = Array.from({ length: Summaries.SUMMARY_LIMITS.newPerRun + 5 }, (_, index) =>
      Fixtures.itemAt(`${index}`),
    )
    const { host, asked, replies } = Fixtures.fakeHostOf({ settings: Fixtures.SUMMARIES_ON })

    replies.push(...items.map(item => Fixtures.answerOf(item.title)))
    await Summaries.summarizeNew(host, Summaries.summaryJobsOf(), items)

    expect(asked.length).toBe(Summaries.SUMMARY_LIMITS.newPerRun)
  })

  test('new items without usable text make no call and leave room for those with text', async () => {
    const textless = Array.from({ length: Summaries.SUMMARY_LIMITS.newPerRun }, (_, index) => ({
      ...Fixtures.itemAt(`bare${index}`),
      text: '',
    }))
    const { host, asked, replies, state } = Fixtures.fakeHostOf({ settings: Fixtures.SUMMARIES_ON })

    replies.push(Fixtures.answerOf('With text.'))
    await Summaries.summarizeNew(host, Summaries.summaryJobsOf(), [
      ...textless,
      Fixtures.itemAt('a'),
    ])

    expect(asked.length).toBe(1)
    expect(state.summaries).toEqual({ 'src:a': 'With text.' })
  })
})
