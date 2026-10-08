import { describe, expect, mock, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'
import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'

describe('summarize-item', () => {
  test('logs the title, then each line of the long summary, to the transcript', async () => {
    const { host, replies, transcript, toasts } = Fixtures.fakeHostOf()

    replies.push(Fixtures.answerOf('First.\nSecond.\nThird.'))

    expect(await Actions.summarizeItem(host, Summaries.summaryJobsOf(), Fixtures.itemAt('a'))).toBe(
      true,
    )
    expect(transcript).toEqual(['a', 'First.', 'Second.', 'Third.'])
    expect(toasts).toEqual([])
  })

  test('a transcript that cannot be written is logged to debug and toasted, not thrown', async () => {
    const { host, replies, toasts, logs } = Fixtures.fakeHostOf()

    replies.push(Fixtures.answerOf('First.\nSecond.\nThird.'))
    host.log = () => {
      throw new Error('no transcript')
    }

    expect(await Actions.summarizeItem(host, Summaries.summaryJobsOf(), Fixtures.itemAt('a'))).toBe(
      false,
    )
    expect(logs).toEqual(['herald: could not show the summary of src:a: no transcript'])
    expect(toasts).toEqual(['No summary of "a" right now; try again later.'])
  })

  test('no summary toasts and logs nothing', async () => {
    const { host, transcript, toasts } = Fixtures.fakeHostOf()
    const item = { ...Fixtures.itemAt('a'), title: 'Two\nlines' }

    expect(await Actions.summarizeItem(host, Summaries.summaryJobsOf(), item)).toBe(false)
    expect(transcript).toEqual([])
    expect(toasts).toEqual(['No summary of "Two lines" right now; try again later.'])
  })

  test("s in the band logs the selected item's long summary with ui.log and starts no turn", async ($, on) => {
    mock.clock(on)

    const { logs, asked, submitted } = Fixtures.bandOn(on, {
      sources: [Fixtures.sourceAt('src')],
      items: { src: Fixtures.datedItemsOf('src', 2) },
    })

    await $.classic.SessionStart({ source: 'clear' })

    const ui = await $.ui.mount({
      plugin: 'herald',
      component: 'AbovePrompt',
      props: Fixtures.BAND_PROPS,
      surface: 'terminal',
    })

    await ui.press({ key: 'down' })
    await ui.press({ key: 'summarize' })

    expect(asked).toEqual(['src 2'])
    expect(logs).toEqual([
      'transcript: src 2',
      'transcript: src 2 one.',
      'transcript: src 2 two.',
      'transcript: src 2 three.',
    ])
    expect(submitted).toEqual([])
  })
})
