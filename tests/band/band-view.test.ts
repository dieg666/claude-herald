import type { ElementQuery, FoundElement } from 'claude-code/testing'
import { describe, expect, mock, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('band-view', () => {
  const SURFACES = ['terminal', 'desktop'] as const
  const SOURCE = Fixtures.sourceAt('src', { icon: 'S' })
  const STORE = { sources: [SOURCE], items: { src: Fixtures.datedItemsOf('src', 7) } }
  const BAND = { plugin: 'news', component: 'AbovePrompt', props: Fixtures.BAND_PROPS } as const

  type Drawing = {
    find: (query: ElementQuery) => Promise<FoundElement | undefined>
    findAll: (query: ElementQuery) => Promise<FoundElement[]>
  }

  const rangeOf = async (ui: Drawing) => (await ui.find({ type: 'Text', text: / of \d+$/ }))?.text

  const autoOf = async (ui: Drawing) => (await ui.find({ key: 'auto' }))?.props.label

  // The headline of the selected row: the bold Text, holding a Link or the plain title.
  const selectedOf = async (ui: Drawing) => {
    const [bold] = (await ui.findAll({ type: 'Text' })).filter(text => text.props.bold === true)
    const [child] = bold?.children ?? []

    return typeof child === 'string' ? child : (child as FoundElement | undefined)?.props.href
  }

  const linksOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Link' })).map(link => [link.props.href, link.children.join('')])

  // A drawn tree without its press handles, which differ from one drawing to the next.
  const shapeOf = (tree: unknown) =>
    JSON.parse(JSON.stringify(tree, (key, value: unknown) => (key === 'press' ? undefined : value)))

  for (const surface of SURFACES) {
    test(
      `on ${surface}: header, three linked items with summaries or a placeholder, actions, then what the mods below drew`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        mock.clock(on)
        Fixtures.bandOn(on, {
          ...STORE,
          summaries: [{ itemId: 'src:1', lang: 'feed', kind: 'short', text: 'First, in short.' }],
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...BAND, surface })

        expect(await rangeOf(ui)).toBe('1-3 of 7')
        expect(await autoOf(ui)).toBe('⏸ auto')
        expect(await linksOf(ui)).toEqual([
          ['https://example.com/src/1', 'src 1'],
          ['https://example.com/src/2', 'src 2'],
          ['https://example.com/src/3', 'src 3'],
        ])
        expect(await ui.find({ type: 'Text', text: 'First, in short.' })).toBeDefined()
        expect((await ui.findAll({ type: 'Text', text: /^…$/ })).length).toBe(2)
        expect(
          (await ui.findAll({ type: 'Text', text: /^S$/ })).map(icon => icon.props.color),
        ).toEqual(['claude', 'claude', 'claude'])
        expect((await ui.findAll({ type: 'Text', text: /^›$/ })).length).toBe(1)
        expect(await selectedOf(ui)).toBe('https://example.com/src/1')
        expect(
          (await ui.findAll({ type: 'Button' })).map(button => [button.key, button.props.label]),
        ).toEqual([
          ['prev', '◀'],
          ['next', '▶'],
          ['auto', '⏸ auto'],
          ['up', '↑'],
          ['down', '↓'],
          ['open', 'Open'],
          ['summarize', 'Summarize'],
          ['save', 'Save'],
          ['copy', 'Copy for Claude'],
        ])
        expect(await ui.find({ type: 'Text', text: 'drawn below' })).toBeDefined()

        await ui.unmount()
      },
    )

    test(`on ${surface}: every color is a theme key and every hotkey one distinct lowercase letter`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...BAND, surface })
      const colors = Fixtures.colorsOf(await ui.drawn())
      const hotkeys = (await ui.findAll({ type: 'Button' })).map(button => button.props.hotkey)

      expect(colors.length > 0).toBe(true)
      expect(colors.filter(color => !Fixtures.THEME_KEYS.includes(color))).toEqual([])
      expect(hotkeys.every(key => typeof key === 'string' && /^[a-z]$/.test(key))).toBe(true)
      expect(new Set(hotkeys).size).toBe(hotkeys.length)
    })

    test(`on ${surface}: next shows the next page and pauses, prev pauses, auto resumes; pages wrap both ways`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...BAND, surface })

      await ui.press({ key: 'next' })

      expect([await rangeOf(ui), await autoOf(ui)]).toEqual(['4-6 of 7', '▶ auto'])

      await ui.press({ key: 'next' })

      expect(await rangeOf(ui)).toBe('7 of 7')
      expect(await linksOf(ui)).toEqual([['https://example.com/src/7', 'src 7']])

      await ui.press({ key: 'next' })

      expect(await rangeOf(ui)).toBe('1-3 of 7')

      await ui.press({ key: 'prev' })

      expect(await rangeOf(ui)).toBe('7 of 7')

      await ui.press({ key: 'auto' })

      expect(await autoOf(ui)).toBe('⏸ auto')

      await ui.press({ key: 'prev' })

      expect([await rangeOf(ui), await autoOf(ui)]).toEqual(['4-6 of 7', '▶ auto'])

      await ui.press({ key: 'auto' })

      expect(await autoOf(ui)).toBe('⏸ auto')
    })

    test(`on ${surface}: j and k move the selection within the page, wrapping, and pause`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...BAND, surface })

      await ui.press({ key: 'down' })

      expect([await selectedOf(ui), await autoOf(ui)]).toEqual([
        'https://example.com/src/2',
        '▶ auto',
      ])

      await ui.press({ key: 'down' })
      await ui.press({ key: 'down' })

      expect(await selectedOf(ui)).toBe('https://example.com/src/1')

      await ui.press({ key: 'up' })

      expect(await selectedOf(ui)).toBe('https://example.com/src/3')

      await ui.press({ key: 'next' })

      expect(await selectedOf(ui)).toBe('https://example.com/src/4')
    })

    test(
      `on ${surface}: the clock turns the page every rotateSeconds while running, never while paused`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        Fixtures.bandOn(on, { ...STORE, settings: { rotateSeconds: 20 } })

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...BAND, surface })

        await clock.advance(19_999)

        expect(await rangeOf(ui)).toBe('1-3 of 7')

        await clock.advance(1)

        expect(await rangeOf(ui)).toBe('4-6 of 7')

        await clock.advance(20_000)

        expect(await rangeOf(ui)).toBe('7 of 7')

        await clock.advance(20_000)

        expect(await rangeOf(ui)).toBe('1-3 of 7')

        await ui.press({ key: 'auto' })
        await clock.advance(60_000)

        expect([await rangeOf(ui), await autoOf(ui)]).toEqual(['1-3 of 7', '▶ auto'])

        await ui.press({ key: 'auto' })
        await clock.advance(20_000)

        expect(await rangeOf(ui)).toBe('4-6 of 7')
      },
    )

    test(`on ${surface}: with three items or fewer the clock never turns the page`, async ($, on) => {
      const clock = mock.clock(on)

      Fixtures.bandOn(on, {
        sources: [SOURCE],
        items: { src: Fixtures.datedItemsOf('src', 3) },
        settings: { rotateSeconds: 20 },
      })

      await $.session.start(Fixtures.SESSION)
      await clock.settle()

      const ui = await $.ui.mount({ ...BAND, surface })

      await ui.press({ key: 'down' })
      await ui.press({ key: 'auto' })
      await clock.advance(100_000)

      expect([await rangeOf(ui), await selectedOf(ui), await autoOf(ui)]).toEqual([
        '1-3 of 3',
        'https://example.com/src/2',
        '⏸ auto',
      ])
    })

    test(`on ${surface}: with a survey up, or nothing to show, only what the mods below drew`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const survey = await $.ui.mount({
        ...BAND,
        surface,
        props: { ...Fixtures.BAND_PROPS, hasSurvey: true },
      })

      expect(await survey.drawn()).toEqual(Fixtures.BELOW_BAND)

      await survey.unmount()
      await $.command.run(Fixtures.newsOf('disable src'))

      const empty = await $.ui.mount({ ...BAND, surface })

      expect(await empty.drawn()).toEqual(Fixtures.BELOW_BAND)
    })

    test(`on ${surface}: a running turn draws the same band`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const idle = await $.ui.mount({ ...BAND, surface })
      const working = await $.ui.mount({
        ...BAND,
        surface,
        props: { ...Fixtures.BAND_PROPS, isWorking: true },
      })

      expect(shapeOf(await working.drawn())).toEqual(shapeOf(await idle.drawn()))
    })

    test(
      `on ${surface}: a page turned to asks once per item without a summary, and drawing again asks nothing`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const { asked } = Fixtures.bandOn(on, STORE)

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...BAND, surface })

        await ui.redraw()

        expect(asked).toEqual([])

        await ui.press({ key: 'next' })
        await clock.settle()

        expect([...asked].sort()).toEqual(['src 4', 'src 5', 'src 6'])
        expect(await ui.find({ type: 'Text', text: 'Summary of src 5.' })).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()

        await ui.redraw()
        await ui.press({ key: 'down' })
        await clock.settle()

        expect(asked.length).toBe(3)

        await ui.press({ key: 'prev' })
        await ui.press({ key: 'next' })
        await clock.settle()

        expect(asked.length).toBe(6)
      },
    )

    test(`on ${surface}: long titles and summaries are cut to the band's width, wide characters as two cells`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, {
        sources: [SOURCE],
        items: {
          src: Fixtures.datedItemsOf('src', 2).map((item, index) => ({
            ...item,
            title: index === 0 ? 'a'.repeat(50) : '漢'.repeat(30),
          })),
        },
        summaries: [{ itemId: 'src:1', lang: 'feed', kind: 'short', text: 'b'.repeat(40) }],
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({
        ...BAND,
        surface,
        props: { ...Fixtures.BAND_PROPS, bodyColumns: 20 },
      })

      // Twenty cells less the mark, the glyph and two spaces leave sixteen for a headline.
      expect((await linksOf(ui)).map(([, text]) => text)).toEqual([
        `${'a'.repeat(15)}…`,
        `${'漢'.repeat(7)}…`,
      ])
      expect(await ui.find({ type: 'Text', text: `${'b'.repeat(15)}…` })).toBeDefined()
    })

    test(`on ${surface}: an address that is not http(s) draws its title as plain text`, async ($, on) => {
      mock.clock(on)

      const [first, ...rest] = Fixtures.datedItemsOf('src', 3)

      Fixtures.bandOn(on, {
        sources: [SOURCE],
        items: { src: [{ ...first, url: 'javascript:alert(1)' }, ...rest] },
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...BAND, surface })

      expect((await linksOf(ui)).map(([href]) => href)).toEqual([
        'https://example.com/src/2',
        'https://example.com/src/3',
      ])
      expect(await selectedOf(ui)).toBe('src 1')
    })

    test(`on ${surface}: items from every enabled source, newest first; when they shrink the page and selection come back inside`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, {
        sources: [Fixtures.sourceAt('old'), Fixtures.sourceAt('new')],
        items: {
          old: Fixtures.datedItemsOf('old', 5, 10),
          new: Fixtures.datedItemsOf('new', 2),
        },
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...BAND, surface })

      expect((await linksOf(ui)).map(([, text]) => text)).toEqual(['new 1', 'new 2', 'old 1'])

      await ui.press({ key: 'next' })
      await ui.press({ key: 'next' })

      expect(await rangeOf(ui)).toBe('7 of 7')

      await $.command.run(Fixtures.newsOf('disable old'))

      expect(await rangeOf(ui)).toBe('1-2 of 2')

      await $.command.run(Fixtures.newsOf('enable old'))

      expect(await rangeOf(ui)).toBe('7 of 7')

      await ui.press({ key: 'next' })
      await ui.press({ key: 'up' })

      expect(await selectedOf(ui)).toBe('https://example.com/old/1')

      await $.command.run(Fixtures.newsOf('disable old'))

      expect([await rangeOf(ui), await selectedOf(ui)]).toEqual([
        '1-2 of 2',
        'https://example.com/new/2',
      ])
    })
  }
})
