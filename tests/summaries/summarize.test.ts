import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'

describe('summarize', () => {
  const ITEM = Fixtures.itemAt('a')

  test('a cached summary is returned with no model call', async () => {
    const { host, asked } = Fixtures.fakeHostOf({
      summaries: [
        {
          itemId: ITEM.id,
          lang: 'es',
          kind: 'short',
          version: Summaries.SUMMARY_PROMPT_VERSION,
          text: 'corto',
        },
      ],
    })

    const text = await Summaries.summarize(host, Summaries.summaryJobsOf(), ITEM, 'es', 'short')

    expect(text).toBe('corto')
    expect(asked).toEqual([])
  })

  test('a miss makes one bounded Haiku request with the signal, cached under item, language and kind', async () => {
    const { host, asked, replies, stored } = Fixtures.fakeHostOf()
    const controller = new AbortController()

    replies.push(Fixtures.answerOf('Short.'))

    const text = await Summaries.summarize(
      host,
      Summaries.summaryJobsOf(),
      ITEM,
      'es',
      'short',
      controller.signal,
    )

    expect(text).toBe('Short.')
    expect(asked.length).toBe(1)
    expect(asked[0]?.signal).toBe(controller.signal)
    expect(asked[0]?.request).toMatchObject({
      model: 'haiku',
      maxTokens: Summaries.SUMMARY_LIMITS.shortMaxTokens,
      timeoutMs: Summaries.SUMMARY_LIMITS.shortTimeoutMs,
      effort: 'low',
    })
    expect(asked[0]?.request.maxTokens).toBeLessThanOrEqual(150)
    expect(stored.get('summaries')).toEqual([
      {
        itemId: ITEM.id,
        lang: 'es',
        kind: 'short',
        version: Summaries.SUMMARY_PROMPT_VERSION,
        text: 'Short.',
      },
    ])
  })

  test('a reply of several lines is cached as one line and mirrored into state in the current language', async () => {
    const { host, replies, state } = Fixtures.fakeHostOf({ settings: { lang: 'es' } })

    replies.push(Fixtures.answerOf('Line one.\nLine two.\n\nLine three.'))

    const text = await Summaries.summarize(host, Summaries.summaryJobsOf(), ITEM, 'es', 'short')

    expect(text).toBe('Line one. Line two. Line three.')
    expect(state.summaries).toEqual({ [ITEM.id]: 'Line one. Line two. Line three.' })
  })

  test('an unanswered reply is not cached and does not throw; the next call asks again', async () => {
    const { host, asked, replies, stored, logs } = Fixtures.fakeHostOf()
    const jobs = Summaries.summaryJobsOf()

    replies.push(Fixtures.unansweredOf('empty-reply'))

    expect(await Summaries.summarize(host, jobs, ITEM, 'feed', 'short')).toBeUndefined()
    expect(stored.get('summaries')).toBeUndefined()
    expect(logs).toEqual([`herald: no short summary of ${ITEM.id}: empty-reply`])

    replies.push(Fixtures.answerOf('Now.'))

    expect(await Summaries.summarize(host, jobs, ITEM, 'feed', 'short')).toBe('Now.')
    expect(asked.length).toBe(2)
  })

  test('an aborted call is not cached, and an aborted signal makes no call', async () => {
    const { host, asked, replies, stored, state } = Fixtures.fakeHostOf()
    const jobs = Summaries.summaryJobsOf()
    const controller = new AbortController()

    replies.push(Fixtures.unansweredOf('aborted'))

    expect(
      await Summaries.summarize(host, jobs, ITEM, 'feed', 'short', controller.signal),
    ).toBeUndefined()

    controller.abort()

    expect(
      await Summaries.summarize(host, jobs, ITEM, 'feed', 'short', controller.signal),
    ).toBeUndefined()
    expect(asked.length).toBe(1)
    expect(stored.get('summaries')).toBeUndefined()
    expect(state.summaries).toEqual({})
  })

  test('a model call that throws or a blank reply gives nothing, logged, never thrown', async () => {
    const { host, replies, stored, logs } = Fixtures.fakeHostOf()
    const jobs = Summaries.summaryJobsOf()
    const complete = host.modelComplete

    host.modelComplete = async () => {
      throw new Error('model unavailable')
    }

    expect(await Summaries.summarize(host, jobs, ITEM, 'feed', 'short')).toBeUndefined()

    host.modelComplete = complete
    replies.push(Fixtures.answerOf('  \n '))

    expect(await Summaries.summarize(host, jobs, ITEM, 'feed', 'long')).toBeUndefined()
    expect(stored.get('summaries')).toBeUndefined()
    expect(logs).toEqual([
      `herald: no short summary of ${ITEM.id}: model unavailable`,
      `herald: no long summary of ${ITEM.id}: blank reply`,
    ])
  })

  test('two calls for the same key while one is in flight make one request', async () => {
    const { host } = Fixtures.fakeHostOf()
    const model = Fixtures.heldModelOf(host)
    const jobs = Summaries.summaryJobsOf()

    const first = Summaries.summarize(host, jobs, ITEM, 'feed', 'short')
    const second = Summaries.summarize(host, jobs, ITEM, 'feed', 'short')

    await model.settle()
    model.held.forEach(call => call.answer(Fixtures.answerOf('Once.')))

    expect(await Promise.all([first, second])).toEqual(['Once.', 'Once.'])
    expect(model.held.length).toBe(1)
  })

  test('another language or kind of the same item is another request', async () => {
    const { host, asked, replies, stored } = Fixtures.fakeHostOf()
    const jobs = Summaries.summaryJobsOf()

    replies.push(Fixtures.answerOf('Uno.'), Fixtures.answerOf('One.'))

    await Summaries.summarize(host, jobs, ITEM, 'es', 'short')
    await Summaries.summarize(host, jobs, ITEM, 'en', 'short')

    const entries = Store.summaryEntriesOf(stored.get('summaries'))

    expect(asked.length).toBe(2)
    expect(Store.summaryOf(entries, ITEM.id, 'es', 'short')).toBe('Uno.')
    expect(Store.summaryOf(entries, ITEM.id, 'en', 'short')).toBe('One.')
  })

  test('a summary whose language changed while the model answered is cached but kept out of state', async () => {
    const { host, stored, state } = Fixtures.fakeHostOf({ settings: { lang: 'es' } })
    const model = Fixtures.heldModelOf(host)

    const text = Summaries.summarize(host, Summaries.summaryJobsOf(), ITEM, 'es', 'short')

    await model.settle()
    stored.set('settings', { lang: 'fr' })
    model.held[0]?.answer(Fixtures.answerOf('Hola.'))

    expect(await text).toBe('Hola.')
    expect(Store.summaryEntriesOf(stored.get('summaries')).length).toBe(1)
    expect(state.summaries).toEqual({})
  })

  test('a long summary is cached under long and never mirrored into state', async () => {
    const { host, replies, stored, state, asked } = Fixtures.fakeHostOf()

    replies.push(Fixtures.answerOf('One.\nTwo.\nThree.'))

    expect(await Summaries.summarize(host, Summaries.summaryJobsOf(), ITEM, 'feed', 'long')).toBe(
      'One.\nTwo.\nThree.',
    )
    expect(asked[0]?.request).toMatchObject({
      maxTokens: Summaries.SUMMARY_LIMITS.longMaxTokens,
      timeoutMs: Summaries.SUMMARY_LIMITS.longTimeoutMs,
    })
    expect(stored.get('summaries')).toEqual([
      {
        itemId: ITEM.id,
        lang: 'feed',
        kind: 'long',
        version: Summaries.SUMMARY_PROMPT_VERSION,
        text: 'One.\nTwo.\nThree.',
      },
    ])
    expect(state.summaries).toEqual({})
  })

  test('an item without usable text gets nothing, with no model call and no cache read or write', async () => {
    const textless = { ...ITEM, text: '' }
    const { host, asked, replies, stored, logs } = Fixtures.fakeHostOf({
      summaries: [
        {
          itemId: ITEM.id,
          lang: 'feed',
          kind: 'short',
          version: Summaries.SUMMARY_PROMPT_VERSION,
          text: 'Kept from when it had text.',
        },
      ],
    })
    const jobs = Summaries.summaryJobsOf()

    replies.push(Fixtures.answerOf('Never asked.'))

    for (const kind of ['short', 'long'] as const) {
      expect(await Summaries.summarize(host, jobs, textless, 'feed', kind)).toBeUndefined()
    }

    expect(asked).toEqual([])
    expect(Store.summaryEntriesOf(stored.get('summaries')).length).toBe(1)
    expect(logs).toEqual([])
  })

  test('a reply that describes the item or shows reasoning is not cached; the next call asks again', async () => {
    const { host, asked, replies, stored, state, logs } = Fixtures.fakeHostOf()
    const jobs = Summaries.summaryJobsOf()

    replies.push(
      Fixtures.answerOf('Anthropic expands a vetting program … Wait, the item giv'),
      Fixtures.answerOf('One.\nAnthropic ships a model, according to the title alone.\nThree.'),
    )

    expect(await Summaries.summarize(host, jobs, ITEM, 'feed', 'short')).toBeUndefined()
    expect(await Summaries.summarize(host, jobs, ITEM, 'feed', 'long')).toBeUndefined()
    expect(stored.get('summaries')).toBeUndefined()
    expect(state.summaries).toEqual({})
    expect(logs).toEqual([
      `herald: no short summary of ${ITEM.id}: the reply describes the item`,
      `herald: no long summary of ${ITEM.id}: the reply describes the item`,
    ])

    replies.push(Fixtures.answerOf('Security researchers get wider access to models.'))

    expect(await Summaries.summarize(host, jobs, ITEM, 'feed', 'short')).toBe(
      'Security researchers get wider access to models.',
    )
    expect(asked.length).toBe(3)
    expect(jobs.rejected.size).toBe(1)
  })

  test('after two rejected replies an item is not asked about for an hour and shows no summary meanwhile', async () => {
    const { host, asked, replies, state, logs } = Fixtures.fakeHostOf()
    const jobs = Summaries.summaryJobsOf()
    const clock = { now: 5_000 }
    const meta = () => Fixtures.answerOf('A model ships, according to the title alone.')

    host.clockNow = async () => clock.now
    replies.push(meta(), meta())

    expect(await Summaries.summarize(host, jobs, ITEM, 'feed', 'short')).toBeUndefined()
    expect(state.summaries).toEqual({})
    expect(await Summaries.summarize(host, jobs, ITEM, 'feed', 'short')).toBeUndefined()
    expect(state.summaries).toEqual({ [ITEM.id]: '' })
    expect(logs.at(-1)).toBe(
      `herald: no short summary of ${ITEM.id}: the reply describes the item; not asked again for an hour`,
    )

    clock.now += Summaries.SUMMARY_LIMITS.rejectedWindowMs - 1

    expect(await Summaries.summarize(host, jobs, ITEM, 'feed', 'short')).toBeUndefined()
    expect(asked.length).toBe(2)

    // Another kind or language of the same item is asked about as usual.
    replies.push(Fixtures.answerOf('Uno.'))

    expect(await Summaries.summarize(host, jobs, ITEM, 'es', 'short')).toBe('Uno.')
    expect(asked.length).toBe(3)

    clock.now += 1
    replies.push(Fixtures.answerOf('A model ships with longer context.'))

    expect(await Summaries.summarize(host, jobs, ITEM, 'feed', 'short')).toBe(
      'A model ships with longer context.',
    )
    expect(asked.length).toBe(4)
    expect(state.summaries).toEqual({ [ITEM.id]: 'A model ships with longer context.' })
    expect(jobs.rejected.size).toBe(0)
  })

  test('a summary an older prompt version wrote is not reused, and the new one replaces it', async () => {
    const { host, asked, replies, stored } = Fixtures.fakeHostOf({
      summaries: [
        { itemId: ITEM.id, lang: 'feed', kind: 'short', text: 'Unversioned.' },
        { itemId: 'src:other', lang: 'feed', kind: 'short', text: 'Other, unversioned.' },
      ],
    })

    replies.push(Fixtures.answerOf('Fresh.'))

    expect(await Summaries.summarize(host, Summaries.summaryJobsOf(), ITEM, 'feed', 'short')).toBe(
      'Fresh.',
    )
    expect(asked.length).toBe(1)
    expect(stored.get('summaries')).toEqual([
      { itemId: 'src:other', lang: 'feed', kind: 'short', version: 0, text: 'Other, unversioned.' },
      {
        itemId: ITEM.id,
        lang: 'feed',
        kind: 'short',
        version: Summaries.SUMMARY_PROMPT_VERSION,
        text: 'Fresh.',
      },
    ])
  })

  test('a failed cache write is logged and the text still returned', async () => {
    const { host, replies, logs } = Fixtures.fakeHostOf()

    replies.push(Fixtures.answerOf('Kept.'))
    host.storeSet = async () => {
      throw new Error('read-only store')
    }

    expect(await Summaries.summarize(host, Summaries.summaryJobsOf(), ITEM, 'feed', 'short')).toBe(
      'Kept.',
    )
    expect(logs).toEqual([`herald: could not keep the summary of ${ITEM.id}: read-only store`])
  })
})
