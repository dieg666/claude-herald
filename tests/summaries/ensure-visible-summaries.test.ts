import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'

describe('ensure-visible-summaries', () => {
  const A = Fixtures.itemAt('a')
  const B = Fixtures.itemAt('b')

  test('cached summaries make no model call and land in state', async () => {
    const { host, asked, state } = Fixtures.fakeHostOf({
      summaries: [
        {
          itemId: A.id,
          lang: 'feed',
          kind: 'short',
          version: Summaries.SUMMARY_PROMPT_VERSION,
          text: 'A.',
        },
        {
          itemId: B.id,
          lang: 'feed',
          kind: 'short',
          version: Summaries.SUMMARY_PROMPT_VERSION,
          text: 'B.',
        },
        {
          itemId: A.id,
          lang: 'feed',
          kind: 'long',
          version: Summaries.SUMMARY_PROMPT_VERSION,
          text: 'A long.',
        },
      ],
    })

    expect(await Summaries.ensureVisibleSummaries(host, Summaries.summaryJobsOf(), [A])).toEqual({
      [A.id]: 'A.',
    })
    expect(asked).toEqual([])
    expect(state.summaries).toEqual({ [A.id]: 'A.', [B.id]: 'B.' })
  })

  test('changing the language makes a new request under a new cache key, and state follows it', async () => {
    const { host, asked, replies, stored, state } = Fixtures.fakeHostOf({
      settings: { lang: 'es' },
    })
    const jobs = Summaries.summaryJobsOf()

    replies.push(Fixtures.answerOf('Corto.'))
    await Summaries.ensureVisibleSummaries(host, jobs, [A])

    expect(state.summaries).toEqual({ [A.id]: 'Corto.' })

    stored.set('settings', { lang: 'fr' })
    replies.push(Fixtures.answerOf('Court.'))

    expect(await Summaries.ensureVisibleSummaries(host, jobs, [A])).toEqual({ [A.id]: 'Court.' })
    expect(asked.length).toBe(2)
    expect(asked[1]?.request.system).toContain('"fr"')
    expect(state.summaries).toEqual({ [A.id]: 'Court.' })

    const entries = Store.summaryEntriesOf(stored.get('summaries'))

    expect(entries.map(entry => Store.summaryKeyOf(entry.itemId, entry.lang, entry.kind))).toEqual([
      `${A.id}|es|short|${Summaries.SUMMARY_PROMPT_VERSION}`,
      `${A.id}|fr|short|${Summaries.SUMMARY_PROMPT_VERSION}`,
    ])

    stored.set('settings', { lang: 'es' })

    expect(await Summaries.ensureVisibleSummaries(host, jobs, [A])).toEqual({ [A.id]: 'Corto.' })
    expect(asked.length).toBe(2)
    expect(state.summaries).toEqual({ [A.id]: 'Corto.' })
  })

  test("user caches under Claude Code's language, or feed when it is unset", async () => {
    const japanese = Fixtures.fakeHostOf({ settings: { lang: 'user' } }, 'japanese')
    const unset = Fixtures.fakeHostOf({ settings: { lang: 'user' } })

    japanese.replies.push(Fixtures.answerOf('Mijikai.'))
    unset.replies.push(Fixtures.answerOf('Short.'))

    await Summaries.ensureVisibleSummaries(japanese.host, Summaries.summaryJobsOf(), [A])
    await Summaries.ensureVisibleSummaries(unset.host, Summaries.summaryJobsOf(), [A])

    expect(japanese.stored.get('summaries')).toEqual([
      {
        itemId: A.id,
        lang: 'japanese',
        kind: 'short',
        version: Summaries.SUMMARY_PROMPT_VERSION,
        text: 'Mijikai.',
      },
    ])
    expect(japanese.asked[0]?.request.system).toContain('"japanese"')
    expect(unset.stored.get('summaries')).toEqual([
      {
        itemId: A.id,
        lang: 'feed',
        kind: 'short',
        version: Summaries.SUMMARY_PROMPT_VERSION,
        text: 'Short.',
      },
    ])
    expect(unset.asked[0]?.request.system).toContain('the language the item itself is written in')
  })

  test('at most two requests are in flight at once, and every item is summarized', async () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map(key => Fixtures.itemAt(key))
    const { host, stored } = Fixtures.fakeHostOf()
    const model = Fixtures.heldModelOf(host)

    const done = Summaries.ensureVisibleSummaries(host, Summaries.summaryJobsOf(), items)

    for (let answered = 0; answered < items.length; answered += 1) {
      await model.settle()

      expect(model.inFlight()).toBe(Math.min(2, items.length - answered))

      model.held[answered]?.answer(Fixtures.answerOf(`S${answered}.`))
    }

    expect(Object.keys(await done).length).toBe(5)
    expect(model.most()).toBe(2)
    expect(model.held.length).toBe(5)
    expect(Store.summaryEntriesOf(stored.get('summaries')).length).toBe(5)
  })

  test('the items go to the model in the order given, the first before the rest', async () => {
    const items = ['c', 'a', 'b', 'd'].map(key => Fixtures.itemAt(key))
    const { host } = Fixtures.fakeHostOf()
    const model = Fixtures.heldModelOf(host)
    const titles = () =>
      model.held.map(({ request }) =>
        typeof request.prompt === 'string' ? /^Title: (.*)$/m.exec(request.prompt)?.[1] : undefined,
      )

    const done = Summaries.ensureVisibleSummaries(host, Summaries.summaryJobsOf(), items)

    for (let answered = 0; answered < items.length; answered += 1) {
      await model.settle()
      model.held[answered]?.answer(Fixtures.answerOf(`S${answered}.`))
    }

    await done

    expect(titles()).toEqual(['c', 'a', 'b', 'd'])
  })

  test('overlapping calls and repeated items ask once per item', async () => {
    const { host } = Fixtures.fakeHostOf()
    const model = Fixtures.heldModelOf(host)
    const jobs = Summaries.summaryJobsOf()

    const first = Summaries.ensureVisibleSummaries(host, jobs, [A, B, A])
    const second = Summaries.ensureVisibleSummaries(host, jobs, [B, A])

    await model.settle()
    model.held.forEach((call, index) => call.answer(Fixtures.answerOf(`S${index}.`)))

    const [one, two] = await Promise.all([first, second])

    expect(model.held.length).toBe(2)
    expect(one).toEqual(two)
  })

  test('an item the model does not answer for is left out, not cached, and nothing throws', async () => {
    const { host, replies, stored, state } = Fixtures.fakeHostOf()

    replies.push(Fixtures.answerOf('A.'), Fixtures.unansweredOf('empty-reply'))

    expect(await Summaries.ensureVisibleSummaries(host, Summaries.summaryJobsOf(), [A, B])).toEqual(
      { [A.id]: 'A.' },
    )
    expect(Store.summaryEntriesOf(stored.get('summaries')).map(entry => entry.itemId)).toEqual([
      A.id,
    ])
    expect(state.summaries).toEqual({ [A.id]: 'A.' })
  })

  test('a store that fails gives nothing, logged, never thrown', async () => {
    const { host, logs, asked } = Fixtures.fakeHostOf()

    host.storeGet = async () => {
      throw new Error('store unavailable')
    }

    expect(await Summaries.ensureVisibleSummaries(host, Summaries.summaryJobsOf(), [A])).toEqual({})
    expect(asked).toEqual([])
    expect(logs).toEqual(['herald: could not summarize the shown items: store unavailable'])
  })

  test('a shown item without usable text gets no summary and no call, even with one cached', async () => {
    const bare = { ...A, text: '' }
    const { host, asked, replies } = Fixtures.fakeHostOf({
      summaries: [
        {
          itemId: A.id,
          lang: 'feed',
          kind: 'short',
          version: Summaries.SUMMARY_PROMPT_VERSION,
          text: 'A.',
        },
      ],
    })

    replies.push(Fixtures.answerOf('B.'))

    expect(
      await Summaries.ensureVisibleSummaries(host, Summaries.summaryJobsOf(), [bare, B]),
    ).toEqual({ [B.id]: 'B.' })
    expect(asked.length).toBe(1)
  })

  test('an item whose replies were rejected twice gets an empty text in state and no call for the hour', async () => {
    const { host, asked, replies, state } = Fixtures.fakeHostOf()
    const jobs = Summaries.summaryJobsOf()

    replies.push(
      Fixtures.answerOf('A model ships, according to the title alone.'),
      Fixtures.answerOf('Hmm, the title says little.'),
    )

    expect(await Summaries.ensureVisibleSummaries(host, jobs, [A])).toEqual({})
    expect(await Summaries.ensureVisibleSummaries(host, jobs, [A])).toEqual({})
    expect(state.summaries).toEqual({ [A.id]: '' })

    // State replaced by another view keeps the empty text on the next one.
    state.summaries = {}
    replies.push(Fixtures.answerOf('B.'))

    expect(await Summaries.ensureVisibleSummaries(host, jobs, [A, B])).toEqual({ [B.id]: 'B.' })
    expect(state.summaries).toEqual({ [A.id]: '', [B.id]: 'B.' })
    expect(asked.length).toBe(3)
  })

  test('an item whose text is only the Comments link makes no model request', async () => {
    const { host, asked } = Fixtures.fakeHostOf()
    const item = { ...A, title: 'Docker Agent', text: 'Comments' }

    expect(await Summaries.ensureVisibleSummaries(host, Summaries.summaryJobsOf(), [item])).toEqual(
      {},
    )
    expect(asked).toEqual([])
  })
})
