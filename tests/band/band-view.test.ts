import type { ElementQuery, FoundElement } from 'claude-code/testing'
import { describe, expect, mock, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'
import Band from '../../hooks/band'
import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'

describe('band-view', () => {
  const SURFACES = ['terminal', 'desktop'] as const
  const SOURCE = Fixtures.sourceAt('src', { icon: 'S' })
  const STORE = { sources: [SOURCE], items: { src: Fixtures.datedItemsOf('src', 7) } }
  const BAND = { plugin: 'herald', component: 'AbovePrompt', props: Fixtures.BAND_PROPS } as const

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
          summaries: [
            {
              itemId: 'src:1',
              lang: 'feed',
              kind: 'short',
              version: Summaries.SUMMARY_PROMPT_VERSION,
              text: 'First, in short.',
            },
          ],
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
      await $.command.run(Fixtures.heraldOf('disable src'))

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
        summaries: [
          {
            itemId: 'src:1',
            lang: 'feed',
            kind: 'short',
            version: Summaries.SUMMARY_PROMPT_VERSION,
            text: 'b'.repeat(40),
          },
        ],
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({
        ...BAND,
        surface,
        props: { ...Fixtures.BAND_PROPS, bodyColumns: 20 },
      })

      // Twenty cells less the mark, the two-cell glyph column and two spaces leave fifteen for a headline.
      expect((await linksOf(ui)).map(([, text]) => text)).toEqual([
        `${'a'.repeat(14)}…`,
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

      await $.command.run(Fixtures.heraldOf('disable old'))

      expect(await rangeOf(ui)).toBe('1-2 of 2')

      await $.command.run(Fixtures.heraldOf('enable old'))

      expect(await rangeOf(ui)).toBe('7 of 7')

      await ui.press({ key: 'next' })
      await ui.press({ key: 'up' })

      expect(await selectedOf(ui)).toBe('https://example.com/old/1')

      await $.command.run(Fixtures.heraldOf('disable old'))

      expect([await rangeOf(ui), await selectedOf(ui)]).toEqual([
        '1-2 of 2',
        'https://example.com/new/2',
      ])
    })
  }

  const stackBandOn = (
    on: Parameters<typeof Fixtures.bandOn>[0],
    settings: Parameters<typeof Fixtures.stackStoreOf>[1],
    entries: Readonly<Record<string, unknown>> = {},
  ) =>
    Fixtures.bandOn(
      on,
      { sources: [], ...Fixtures.stackStoreOf(Fixtures.STACK_SAMPLE, settings), ...entries },
      Fixtures.stackTreeOf(Fixtures.STACK_SAMPLE),
    )

  // Every package the band pages through, page after page, from the release links.
  const packagesOf = async (
    ui: Drawing & { press: (target: { key: string }) => Promise<unknown> },
  ) => {
    const total = Number(/of (\d+)$/.exec((await rangeOf(ui)) ?? '')?.[1] ?? 0)
    const names: string[] = []

    for (let page = 0; page < Math.ceil(total / 3); page += 1) {
      for (const [href] of await linksOf(ui)) {
        names.push(/github\.com\/owner\/([^/]+)\//.exec(String(href))?.[1] ?? String(href))
      }

      await ui.press({ key: 'next' })
    }

    return names
  }

  const SHOWN = {
    all: ['react', 'vite', 'lodash', 'requests', 'next', 'zod'],
    'minor+': ['react', 'vite', 'requests', 'zod'],
    'major+breaking+security': ['react', 'requests', 'zod'],
    'breaking+security': ['react', 'requests'],
  } as const

  for (const surface of SURFACES) {
    for (const [showLevel, names] of Object.entries(SHOWN)) {
      test(
        `on ${surface}: show level ${showLevel} pages through ${names.join(', ')}`,
        { timeoutMs: 20_000 },
        async ($, on) => {
          const clock = mock.clock(on)

          stackBandOn(on, { showLevel: showLevel as keyof typeof SHOWN })

          await $.session.start(Fixtures.SESSION)
          await clock.settle()

          const ui = await $.ui.mount({ ...BAND, surface })

          expect(await packagesOf(ui)).toEqual([...names])
        },
      )
    }

    test(
      `on ${surface}: a stack row shows ⚠ or 📦, links "pkg current → new" to the release and shows its level beneath`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        stackBandOn(on, { showLevel: 'all' })

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...BAND, surface })

        expect(await linksOf(ui)).toEqual([
          [
            'https://github.com/owner/react/releases/tag/v19.0.0',
            'react 18.2.0 → 19.0.0 · React 19',
          ],
          ['https://github.com/owner/vite/releases/tag/v5.1.0', 'vite 5.0.0 → 5.1.0'],
          ['https://github.com/owner/lodash/releases/tag/v4.17.21', 'lodash 4.17.20 → 4.17.21'],
        ])
        expect(
          (await ui.findAll({ type: 'Text', text: /^(⚠|📦)$/ })).map(icon => icon.text),
        ).toEqual(['⚠', '📦', '📦'])
        expect(await ui.find({ type: 'Text', text: 'npm · major · breaking' })).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()
      },
    )

    test(
      `on ${surface}: turning the stack off for the project hides only its releases`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const news = { sources: [SOURCE], items: { src: Fixtures.datedItemsOf('src', 2) } }

        stackBandOn(on, { isEnabled: false, showLevel: 'all' }, news)

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...BAND, surface })

        expect(await rangeOf(ui)).toBe('1-2 of 2')
        expect(await ui.find({ type: 'Text', text: /^(⚠|📦)$/ })).toBeUndefined()
        expect(await linksOf(ui)).toEqual([
          ['https://example.com/src/1', 'src 1'],
          ['https://example.com/src/2', 'src 2'],
        ])
      },
    )

    test(
      `on ${surface}: with the stack on, its releases join the news items`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const news = { sources: [SOURCE], items: { src: Fixtures.datedItemsOf('src', 2) } }

        stackBandOn(on, { showLevel: 'all' }, news)

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...BAND, surface })

        expect(await rangeOf(ui)).toBe('1-3 of 8')
      },
    )
  }

  for (const surface of SURFACES) {
    test(`on ${surface}: ⚠ and 📦 rows start their headlines in the same column`, async ($, on) => {
      const clock = mock.clock(on)

      stackBandOn(on, { showLevel: 'all' })

      await $.session.start(Fixtures.SESSION)
      await clock.settle()

      const ui = await $.ui.mount({ ...BAND, surface })
      // The cells before each headline: the mark, a space, the glyph and its gap.
      const leads = (await ui.findAll({ type: 'Text' }))
        .filter(text => text.props.wrap === 'truncate-end' && text.children.length > 3)
        .map(text =>
          text.children
            .slice(0, 4)
            .map(child =>
              typeof child === 'string'
                ? child
                : (child as { children: string[] }).children.join(''),
            )
            .join(''),
        )

      expect(leads.length).toBe(3)
      expect(leads.map(lead => Band.displayWidthOf(lead))).toEqual([5, 5, 5])
    })
  }

  for (const surface of SURFACES) {
    test(
      `on ${surface}: an item without text draws no summary and no placeholder, keeps its second line empty, and is never sent to the model`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const items = Fixtures.datedItemsOf('src', 7).map(item =>
          item.id === 'src:2' || item.id === 'src:5' ? { ...item, text: '' } : item,
        )
        const { asked, logs } = Fixtures.bandOn(on, {
          sources: [SOURCE],
          items: { src: items },
          summaries: [
            {
              itemId: 'src:2',
              lang: 'feed',
              kind: 'short',
              version: Summaries.SUMMARY_PROMPT_VERSION,
              text: 'Restates the headline, according to the title alone.',
            },
          ],
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...BAND, surface })
        const spacers = async () =>
          (await ui.findAll({ type: 'Box' })).filter(box => box.props.height === 1)

        expect(await linksOf(ui)).toEqual([
          ['https://example.com/src/1', 'src 1'],
          ['https://example.com/src/2', 'src 2'],
          ['https://example.com/src/3', 'src 3'],
        ])
        expect((await ui.findAll({ type: 'Text', text: /^…$/ })).length).toBe(2)
        expect(await ui.find({ type: 'Text', text: /according to the title/ })).toBeUndefined()
        expect((await spacers()).length).toBe(1)

        await ui.press({ key: 'next' })
        await clock.settle()

        expect([...asked].sort()).toEqual(['src 4', 'src 6'])
        expect(await ui.find({ type: 'Text', text: 'Summary of src 4.' })).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()
        expect((await spacers()).length).toBe(1)

        await ui.press({ key: 'down' })
        await ui.press({ key: 'summarize' })

        expect([...asked].sort()).toEqual(['src 4', 'src 6'])
        expect(logs.filter(line => line.startsWith('transcript: '))).toEqual([
          'transcript: src 5',
          `transcript: ${Actions.NO_TEXT_LINE}`,
        ])
      },
    )
  }

  for (const surface of SURFACES) {
    test(
      `on ${surface}: an item whose replies were rejected twice stops showing … and is not asked about again`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const id = `muted-${surface}`
        const asked: string[] = []

        Fixtures.storeOn(on, {
          sources: [Fixtures.sourceAt(id, { icon: 'S' })],
          items: { [id]: Fixtures.datedItemsOf(id, 7) },
          settings: { rotateSeconds: 3600 },
        })
        Fixtures.registerOn(on)
        on('ui.render', () => Fixtures.BELOW_BAND)
        on('ui.log', () => ({ value: undefined }))
        on('model.complete', ($, e) => {
          const title = /^Title: (.*)$/m.exec(e.prompt)?.[1] ?? ''

          asked.push(title)

          return {
            value: Fixtures.answerOf(
              title === `${id} 2`
                ? 'A program grows, according to the title alone.'
                : `Summary of ${title}.`,
            ),
          }
        })
        on('http.fetch', () => ({ deny: 'offline' }))
        on('classic.SessionStart', () => ({}))

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...BAND, surface })
        const turn = async () => {
          await ui.press({ key: 'next' })
          await ui.press({ key: 'prev' })
          await clock.settle()
        }
        const askedOfMuted = () => asked.filter(title => title === `${id} 2`).length

        await turn()

        expect(askedOfMuted()).toBe(1)
        expect((await ui.findAll({ type: 'Text', text: /^…$/ })).length).toBe(1)

        await turn()

        expect(askedOfMuted()).toBe(2)
        expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()
        expect(await ui.find({ type: 'Text', text: /according to the title/ })).toBeUndefined()
        expect(
          (await ui.findAll({ type: 'Box' })).filter(box => box.props.height === 1).length,
        ).toBe(1)

        await turn()

        expect(askedOfMuted()).toBe(2)
      },
    )
  }
})
