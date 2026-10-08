import type { ElementQuery, FoundElement } from 'claude-code/testing'
import { describe, expect, mock, test } from 'claude-code/testing'

import Names from '../../hooks/names'
import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-view', () => {
  const SURFACES = ['terminal', 'desktop'] as const
  const ALPHA = Fixtures.sourceAt('a', { name: 'Alpha', icon: 'A' })
  const OFF = Fixtures.sourceAt('off', { name: 'Off', isEnabled: false })
  const BETA = Fixtures.sourceAt('b', { name: 'Beta', icon: 'B' })

  const STORE = {
    sources: [ALPHA, OFF, BETA],
    items: {
      a: Fixtures.datedItemsOf('a', 3),
      off: Fixtures.datedItemsOf('off', 1),
      b: Fixtures.datedItemsOf('b', 2),
    },
  }

  const PANE = {
    plugin: 'herald',
    component: 'Pane',
    requestId: Names.PANE_ID,
    props: Fixtures.PANE_PROPS,
  } as const

  type Drawing = {
    find: (query: ElementQuery) => Promise<FoundElement | undefined>
    findAll: (query: ElementQuery) => Promise<FoundElement[]>
  }

  const tabsOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Button' }))
      .filter(button => button.key?.startsWith('tab-') === true)
      .map(button => [button.key, button.props.label, button.props.hotkey, button.props.dimColor])

  const keysOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Button' })).map(button => button.key)

  const linksOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Link' })).map(link => link.props.href)

  const headingOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Text' })).find(
      text => text.props.color === 'suggestion' && text.text !== '›',
    )?.text

  // The headline of the selected row: the bold Text, holding a Link or the plain title.
  const selectedOf = async (ui: Drawing) => {
    const [bold] = (await ui.findAll({ type: 'Text' })).filter(text => text.props.bold === true)
    const [child] = bold?.children ?? []

    return typeof child === 'string' ? child : (child as FoundElement | undefined)?.props.href
  }

  const savedOf = async (peek: () => Promise<string | undefined>) =>
    (JSON.parse((await peek()) ?? 'null') as { saved: { id: string }[] }).saved.map(item => item.id)

  for (const surface of SURFACES) {
    test(
      `on ${surface}: a tab per enabled source then Saved, the first active; its items linked, dated, summarized or pending`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        mock.clock(on)
        Fixtures.bandOn(on, {
          ...STORE,
          summaries: [{ itemId: 'a:1', lang: 'feed', kind: 'short', text: 'First, in short.' }],
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...PANE, surface })

        expect(await tabsOf(ui)).toEqual([
          ['tab-a', 'Alpha', '1', false],
          ['tab-b', 'Beta', '2', true],
          ['tab-saved', 'Saved', '0', true],
        ])
        expect(await headingOf(ui)).toBe('Alpha · 1-3 of 3')
        expect(await linksOf(ui)).toEqual([
          'https://example.com/a/1',
          'https://example.com/a/2',
          'https://example.com/a/3',
        ])
        expect(await ui.find({ type: 'Text', text: /^Jan 2$/ })).toBeDefined()
        expect((await ui.findAll({ type: 'Text', text: /^Jan 1$/ })).length).toBe(2)
        expect(await ui.find({ type: 'Text', text: 'First, in short.' })).toBeDefined()
        expect((await ui.findAll({ type: 'Text', text: /^…$/ })).length).toBe(2)
        expect(await selectedOf(ui)).toBe('https://example.com/a/1')
        expect(await keysOf(ui)).toEqual([
          'tab-a',
          'tab-b',
          'tab-saved',
          'up',
          'down',
          'open',
          'summarize',
          'save',
          'copy',
        ])
      },
    )

    test(`on ${surface}: every color is a theme key and every hotkey one distinct digit or lowercase letter`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, {
        ...STORE,
        saved: [{ ...Fixtures.datedItemsOf('a', 1)[0], savedAt: 1 }],
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })

      for (const tab of ['tab-a', 'tab-saved']) {
        await ui.press({ key: tab })

        const colors = Fixtures.colorsOf(await ui.drawn())
        const hotkeys = (await ui.findAll({ type: 'Button' })).map(button => button.props.hotkey)

        expect(colors.length > 0).toBe(true)
        expect(colors.filter(color => !Fixtures.THEME_KEYS.includes(color))).toEqual([])
        expect(hotkeys.every(key => typeof key === 'string' && /^[a-z0-9]$/.test(key))).toBe(true)
        expect(new Set(hotkeys).size).toBe(hotkeys.length)
      }
    })

    test(`on ${surface}: pressing a tab shows that source's items from the top and marks it active`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })

      await ui.press({ key: 'down' })
      await ui.press({ key: 'tab-b' })

      expect(await linksOf(ui)).toEqual(['https://example.com/b/1', 'https://example.com/b/2'])
      expect(await headingOf(ui)).toBe('Beta · 1-2 of 2')
      expect(await selectedOf(ui)).toBe('https://example.com/b/1')
      expect((await tabsOf(ui)).map(([key, , , isDim]) => [key, isDim])).toEqual([
        ['tab-a', true],
        ['tab-b', false],
        ['tab-saved', true],
      ])

      await ui.press({ key: 'tab-a' })

      expect(await selectedOf(ui)).toBe('https://example.com/a/1')
    })

    test(
      `on ${surface}: saving from a source tab lists the item under Saved; mark as read takes it off the list and the store`,
      { plugins: [Fixtures.STATE_PEEK], timeoutMs: 20_000 },
      async ($, on) => {
        mock.clock(on, { now: 5000 })

        const { stored, toasts } = Fixtures.bandOn(on, STORE)
        const peek = async () => (await $.command.run(Fixtures.PEEK)).text

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...PANE, surface })

        expect(await ui.find({ key: 'read' })).toBeUndefined()

        await ui.press({ key: 'down' })
        await ui.press({ key: 'save' })

        expect((await ui.find({ key: 'save' }))?.props.label).toBe('Saved')

        await ui.press({ key: 'tab-saved' })

        expect(await headingOf(ui)).toBe('Saved · 1 of 1')
        expect(await linksOf(ui)).toEqual(['https://example.com/a/2'])
        expect((await ui.find({ key: 'save' }))?.props.label).toBe('Saved')
        expect((await ui.find({ key: 'read' }))?.props.hotkey).toBe('r')
        expect(stored.get('saved')).toEqual([{ ...STORE.items.a[1], savedAt: 5000 }])
        expect(await savedOf(peek)).toEqual(['a:2'])

        await ui.press({ key: 'read' })

        expect(await linksOf(ui)).toEqual([])
        expect(
          await ui.find({
            type: 'Text',
            text: 'Nothing saved yet: press v on an item to keep it here.',
          }),
        ).toBeDefined()
        expect(await ui.find({ key: 'open' })).toBeUndefined()
        expect(stored.get('saved')).toEqual([])
        expect(await savedOf(peek)).toEqual([])
        expect(toasts).toEqual([])
      },
    )

    test(`on ${surface}: a tab whose source is removed or turned off falls back to the first, from the top`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })

      await ui.press({ key: 'tab-b' })
      await ui.press({ key: 'down' })
      await $.command.run(Fixtures.heraldOf('remove Beta'))

      expect((await tabsOf(ui)).map(([key]) => key)).toEqual(['tab-a', 'tab-saved'])
      expect([await headingOf(ui), await selectedOf(ui)]).toEqual([
        'Alpha · 1-3 of 3',
        'https://example.com/a/1',
      ])

      await ui.press({ key: 'down' })
      await $.command.run(Fixtures.heraldOf('disable Alpha'))

      expect(await tabsOf(ui)).toEqual([['tab-saved', 'Saved', '0', false]])
      expect(await headingOf(ui)).toBe('Saved')
    })

    test(`on ${surface}: a long list shows a window around the selection; j and k stop at the ends`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, { sources: [ALPHA], items: { a: Fixtures.datedItemsOf('a', 20) } })

      await $.classic.SessionStart({ source: 'clear' })

      // Twelve rows less the tab row, the heading and the action row leave four items.
      const ui = await $.ui.mount({
        ...PANE,
        surface,
        props: { ...Fixtures.PANE_PROPS, scroll: { offset: 0, bodyRows: 12 } },
      })

      expect(await headingOf(ui)).toBe('Alpha · 1-4 of 20')

      await ui.press({ key: 'up' })

      expect(await selectedOf(ui)).toBe('https://example.com/a/1')

      for (let press = 0; press < 3; press += 1) {
        await ui.press({ key: 'down' })
      }

      expect([await headingOf(ui), await selectedOf(ui)]).toEqual([
        'Alpha · 2-5 of 20',
        'https://example.com/a/4',
      ])

      for (let press = 0; press < 20; press += 1) {
        await ui.press({ key: 'down' })
      }

      expect([await headingOf(ui), await selectedOf(ui)]).toEqual([
        'Alpha · 17-20 of 20',
        'https://example.com/a/20',
      ])
      expect((await linksOf(ui)).length).toBe(4)
    })

    test(
      `on ${surface}: a tab switch or a window move asks once per item without a summary; drawing again or moving inside the window asks nothing`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const gone = { ...Fixtures.datedItemsOf('gone', 1)[0], savedAt: 1 }
        const { asked } = Fixtures.bandOn(on, {
          sources: [ALPHA, BETA],
          items: { a: Fixtures.datedItemsOf('a', 6), b: Fixtures.datedItemsOf('b', 2) },
          saved: [gone],
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({
          ...PANE,
          surface,
          props: { ...Fixtures.PANE_PROPS, scroll: { offset: 0, bodyRows: 12 } },
        })

        await ui.redraw()
        await clock.settle()

        expect(asked).toEqual([])

        await ui.press({ key: 'tab-b' })
        await clock.settle()

        expect([...asked].sort()).toEqual(['b 1', 'b 2'])
        expect(await ui.find({ type: 'Text', text: 'Summary of b 2.' })).toBeDefined()

        await ui.press({ key: 'tab-b' })
        await ui.press({ key: 'down' })
        await ui.redraw()
        await clock.settle()

        expect(asked.length).toBe(2)

        await ui.press({ key: 'tab-a' })
        await clock.settle()

        expect(asked.slice(2).sort()).toEqual(['a 1', 'a 2', 'a 3', 'a 4'])

        await ui.press({ key: 'down' })
        await ui.press({ key: 'down' })
        await clock.settle()

        expect(asked.length).toBe(6)

        await ui.press({ key: 'down' })
        await clock.settle()

        expect(asked.slice(6)).toEqual(['a 5'])

        await ui.press({ key: 'tab-saved' })
        await clock.settle()

        expect(asked.slice(7)).toEqual(['gone 1'])
        expect(await ui.find({ type: 'Text', text: 'Summary of gone 1.' })).toBeDefined()
        expect((await ui.findAll({ type: 'Text', text: /^\*$/ })).length).toBe(1)
      },
    )

    test(`on ${surface}: the hook draws the pane opened under PANE_ID and leaves any other pane to the mods below`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const ours = await $.ui.mount({ ...PANE, surface })

      expect(await ours.find({ key: 'tab-saved' })).toBeDefined()

      const other = await $.ui.mount({ ...PANE, requestId: 'other', surface })

      expect(await other.drawn()).toEqual(Fixtures.BELOW_BAND)
    })

    test(
      `on ${surface}: /herald before any drawing summarizes a first window; after a drawing, exactly the rows a tall pane shows, once each`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const { asked } = Fixtures.bandOn(on, {
          sources: [ALPHA],
          items: { a: Fixtures.datedItemsOf('a', 30) },
        })
        const titlesTo = (count: number) =>
          Array.from({ length: count }, (_, index) => `a ${index + 1}`).sort()

        Fixtures.paneOn(on, [surface])

        await $.classic.SessionStart({ source: 'clear' })
        await $.command.run(Fixtures.heraldOf(''))
        await clock.settle()

        expect([...asked].sort()).toEqual(titlesTo(Pane.PANE_FIRST_WINDOW))

        // Sixty rows less the tab row, the heading and the action row leave twenty-eight items.
        const ui = await $.ui.mount({
          ...PANE,
          surface,
          props: { ...Fixtures.PANE_PROPS, scroll: { offset: 0, bodyRows: 60 } },
        })

        expect(await headingOf(ui)).toBe('Alpha · 1-28 of 30')

        await $.command.run(Fixtures.heraldOf(''))
        await clock.settle()
        await ui.redraw()
        await clock.settle()

        expect([...asked].sort()).toEqual(titlesTo(28))
        expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()
      },
    )

    test(
      `on ${surface}: a new summary language refreshes the whole window the open pane shows, not only the band's page`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const items = Fixtures.datedItemsOf('a', 6)
        const { asked } = Fixtures.bandOn(on, {
          sources: [ALPHA],
          items: { a: items },
          summaries: items.map(item => ({
            itemId: item.id,
            lang: 'feed',
            kind: 'short',
            text: `Cached ${item.title}.`,
          })),
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...PANE, surface })

        expect(await ui.find({ type: 'Text', text: 'Cached a 6.' })).toBeDefined()

        await $.command.run(Fixtures.heraldOf('lang fr'))
        await clock.settle()

        expect([...new Set(asked)].sort()).toEqual(items.map(item => item.title).sort())
        expect(await ui.find({ type: 'Text', text: 'Summary of a 6.' })).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()
      },
    )

    test(`on ${surface}: only the first nine sources get digit hotkeys; Saved keeps 0`, async ($, on) => {
      mock.clock(on)

      const sources = Array.from({ length: 10 }, (_, index) => Fixtures.sourceAt(`s${index + 1}`))

      Fixtures.bandOn(on, { sources, items: {} })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })

      expect((await tabsOf(ui)).map(([key, , hotkey]) => [key, hotkey])).toEqual([
        ...sources.slice(0, 9).map((source, index) => [`tab-${source.id}`, String(index + 1)]),
        ['tab-s10', undefined],
        ['tab-saved', '0'],
      ])

      await ui.press({ key: 'tab-s10' })

      expect(await headingOf(ui)).toBe('s10')
    })

    test(`on ${surface}: an empty source tab, an empty Saved and no sources at all draw a line and no actions`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, { sources: [ALPHA], items: {} })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })

      expect(await headingOf(ui)).toBe('Alpha')
      expect(await ui.find({ type: 'Text', text: 'Nothing from Alpha yet.' })).toBeDefined()
      expect(await keysOf(ui)).toEqual(['tab-a', 'tab-saved', 'up', 'down'])

      await ui.press({ key: 'tab-saved' })

      expect(
        await ui.find({
          type: 'Text',
          text: 'Nothing saved yet: press v on an item to keep it here.',
        }),
      ).toBeDefined()
      expect(await ui.find({ key: 'read' })).toBeUndefined()

      await $.command.run(Fixtures.heraldOf('remove Alpha'))

      expect(await tabsOf(ui)).toEqual([['tab-saved', 'Saved', '0', false]])
    })

    test(`on ${surface}: an address that is not http(s) draws as plain text; long and wide titles are cut to the width`, async ($, on) => {
      mock.clock(on)

      const [first, second, third] = Fixtures.datedItemsOf('a', 3)

      Fixtures.bandOn(on, {
        sources: [ALPHA],
        items: {
          a: [
            { ...first, url: 'javascript:alert(1)' },
            { ...second, title: 'b'.repeat(30) },
            { ...third, title: '漢'.repeat(20) },
          ],
        },
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({
        ...PANE,
        surface,
        props: { ...Fixtures.PANE_PROPS, bodyColumns: 20 },
      })

      // Twenty cells less the mark, the two-cell glyph column, two spaces and ` Jan 1` leave nine for a headline.
      expect(
        (await ui.findAll({ type: 'Link' })).map(link => [link.props.href, link.children.join('')]),
      ).toEqual([
        ['https://example.com/a/2', `${'b'.repeat(8)}…`],
        ['https://example.com/a/3', `${'漢'.repeat(4)}…`],
      ])
      expect(await selectedOf(ui)).toBe('a 1')
    })

    test(
      `on ${surface}: open, summarize and copy act on the selected item as the band's do`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const runs: (readonly string[])[] = []
        const copies: string[] = []

        mock.clock(on)

        const { logs, toasts, submitted } = Fixtures.bandOn(on, STORE)

        on('env.get', () => ({ value: undefined }))
        on('process.run', ($, e) => {
          runs.push(e.argv)

          return {
            value: {
              exitCode: 0,
              stdout: e.argv[0] === 'uname' ? 'Darwin\n' : '',
              stderr: '',
              isStdoutTruncated: false,
              isStderrTruncated: false,
            },
          }
        })
        on('ui.copy', ($, e) => {
          copies.push(e.text)

          return { value: { isCopied: true } }
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...PANE, surface })

        await ui.press({ key: 'tab-b' })
        await ui.press({ key: 'down' })
        await ui.press({ key: 'open' })
        await ui.press({ key: 'summarize' })
        await ui.press({ key: 'copy' })

        expect(runs).toEqual([
          ['uname', '-s'],
          ['open', 'https://example.com/b/2'],
        ])
        expect(logs.filter(line => line.startsWith('transcript: '))).toEqual([
          'transcript: b 2',
          'transcript: b 2 one.',
          'transcript: b 2 two.',
          'transcript: b 2 three.',
        ])
        expect(copies.length).toBe(1)
        expect(copies[0]).toContain('https://example.com/b/2')
        expect(toasts).toEqual(['📋 Copied'])
        expect(submitted).toEqual([])
      },
    )
  }

  const stackPaneOn = (
    on: Parameters<typeof Fixtures.bandOn>[0],
    settings: Parameters<typeof Fixtures.stackStoreOf>[1],
  ) =>
    Fixtures.bandOn(
      on,
      { ...STORE, ...Fixtures.stackStoreOf(Fixtures.STACK_SAMPLE, settings) },
      Fixtures.stackTreeOf(Fixtures.STACK_SAMPLE),
    )

  // The packages of the release links drawn, in order.
  const packagesOf = async (ui: Drawing) =>
    (await linksOf(ui)).map(href => /github\.com\/owner\/([^/]+)\//.exec(String(href))?.[1])

  // The ecosystem headings drawn above the stack rows.
  const groupsOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Text' }))
      .filter(text => text.props.bold === true && text.props.color === 'suggestion')
      .map(text => text.text)

  for (const surface of SURFACES) {
    test(
      `on ${surface}: the Your stack tab on y groups the packages by ecosystem, flagged then by level, and its filter narrows them`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        stackPaneOn(on, {})

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...PANE, surface })

        expect(await tabsOf(ui)).toEqual([
          ['tab-a', 'Alpha', '1', false],
          ['tab-b', 'Beta', '2', true],
          ['tab-@stack', 'Your stack', 'y', true],
          ['tab-saved', 'Saved', '0', true],
        ])

        await ui.press({ key: 'tab-@stack' })

        expect(await headingOf(ui)).toBe('Your stack · 1-4 of 4')
        expect(await groupsOf(ui)).toEqual(['npm', 'PyPI'])
        expect(await packagesOf(ui)).toEqual(['react', 'zod', 'vite', 'requests'])
        expect((await ui.find({ key: 'filter' }))?.type).toBe('Input')

        await ui.input({ key: 'filter', text: 're', kind: 'change' })

        expect(await packagesOf(ui)).toEqual(['react', 'requests'])
        expect(await groupsOf(ui)).toEqual(['npm', 'PyPI'])

        await ui.input({ key: 'filter', text: 'security' })

        expect(await packagesOf(ui)).toEqual(['requests'])
        expect(await groupsOf(ui)).toEqual(['PyPI'])

        await ui.input({ key: 'filter', text: 'zzz' })

        expect(await ui.find({ type: 'Text', text: 'No release matches "zzz".' })).toBeDefined()

        const hotkeys = (await ui.findAll({ type: 'Button' })).map(button => button.props.hotkey)

        expect(new Set(hotkeys).size).toBe(hotkeys.length)
      },
    )

    test(
      `on ${surface}: the stack tab shows the project's show level, and no tab while the stack is off`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        stackPaneOn(on, { showLevel: 'breaking+security' })

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...PANE, surface })

        await ui.press({ key: 'tab-@stack' })

        expect(await packagesOf(ui)).toEqual(['react', 'requests'])
      },
    )

    test(
      `on ${surface}: with the stack off the pane has no stack tab and its other tabs stay`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        stackPaneOn(on, { isEnabled: false })

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...PANE, surface })

        expect((await tabsOf(ui)).map(([key]) => key)).toEqual(['tab-a', 'tab-b', 'tab-saved'])
        expect(await linksOf(ui)).toEqual([
          'https://example.com/a/1',
          'https://example.com/a/2',
          'https://example.com/a/3',
        ])
      },
    )
  }

  const releasesPaneOn = (on: Parameters<typeof Fixtures.bandOn>[0]) =>
    Fixtures.bandOn(
      on,
      { ...STORE, ...Fixtures.stackStoreOf(Fixtures.STACK_RELEASES) },
      Fixtures.stackTreeOf(Fixtures.STACK_RELEASES),
    )

  // Every string a drawn element holds, its descendants' included, in document order.
  const textOf = (node: unknown): string =>
    typeof node === 'string'
      ? node
      : ((node as { children?: unknown[] }).children ?? []).map(textOf).join('')

  // The stack tab's rows as one line each, runs of spaces made one.
  const rowLinesOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Text' }))
      .filter(
        text =>
          text.props.wrap === 'truncate-end' &&
          text.props.color === undefined &&
          text.props.dimColor !== true,
      )
      .map(text => textOf(text).replace(/\s+/g, ' ').trim())

  const WIDE = { ...Fixtures.PANE_PROPS, bodyColumns: 120 }

  // The link of the selected stack row: the bold headline, not an ecosystem heading.
  const selectedRowOf = async (ui: Drawing) => {
    const [bold] = (await ui.findAll({ type: 'Text' })).filter(
      text => text.props.bold === true && text.props.color === undefined,
    )
    const [child] = bold?.children ?? []

    return typeof child === 'string' ? child : (child as FoundElement | undefined)?.props.href
  }

  for (const surface of SURFACES) {
    test(
      `on ${surface}: one row per package with in-use → newest, highest level, flags naming their release and the release count; flagged first; the summary line; the change colored by level`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        releasesPaneOn(on)

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...PANE, surface, props: WIDE })

        await ui.press({ key: 'tab-@stack' })

        expect(await headingOf(ui)).toBe('Your stack · 1-6 of 6')
        expect(
          await ui.find({ type: 'Text', text: '6 packages behind · 2 security · 1 breaking' }),
        ).toBeDefined()
        expect(await groupsOf(ui)).toEqual(['npm', 'PyPI'])
        expect(await rowLinesOf(ui)).toEqual([
          '› ⚠ @astrojs/node 9.5.5 → 11.1.7 major security Oct 6',
          '⚠ jsdom 25.0.1 → 30.1.2 major breaking in 30.0.0 · 3 releases Oct 5',
          '📦 astro 5.18.1 → 7.3.7 major Oct 7',
          '📦 @fortawesome/fontawesome-svg-core 7.1.0 → 7.3.1 minor 2 releases Jul 15',
          '📦 left-pad 1.0.0 → canary Oct 8',
          '⚠ requests 2.31.0 → 2.31.1 patch security Apr 1',
        ])

        const changed = (await ui.findAll({ type: 'Text' }))
          .filter(text => ['error', 'warning', 'success'].includes(String(text.props.color)))
          .map(text => [text.text, text.props.color])

        expect(changed).toEqual([
          ['11.1.7', 'error'],
          ['30.1.2', 'error'],
          ['7.3.7', 'error'],
          ['3.1', 'warning'],
          ['1', 'success'],
        ])

        const colors = Fixtures.colorsOf(await ui.drawn())
        const hotkeys = (await ui.findAll({ type: 'Button' })).map(button => button.props.hotkey)

        expect(colors.filter(color => !Fixtures.THEME_KEYS.includes(color))).toEqual([])
        expect(new Set(hotkeys).size).toBe(hotkeys.length)
        expect((await ui.find({ key: 'releases' }))?.props).toMatchObject({
          label: 'Releases',
          hotkey: 'e',
        })
        expect(await ui.find({ key: 'read' })).toBeUndefined()

        await ui.press({ key: 'tab-a' })

        expect(await ui.find({ key: 'releases' })).toBeUndefined()
      },
    )

    test(
      `on ${surface}: e lists the selected package's releases under it and hides them again; the actions act on the newest release, or on the release selected`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const runs: (readonly string[])[] = []
        const copies: string[] = []
        const { logs, stored } = releasesPaneOn(on)

        on('env.get', () => ({ value: undefined }))
        on('process.run', ($, e) => {
          runs.push(e.argv)

          return {
            value: {
              exitCode: 0,
              stdout: e.argv[0] === 'uname' ? 'Darwin\n' : '',
              stderr: '',
              isStdoutTruncated: false,
              isStderrTruncated: false,
            },
          }
        })
        on('ui.copy', ($, e) => {
          copies.push(e.text)

          return { value: { isCopied: true } }
        })

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...PANE, surface, props: WIDE })
        const url = (version: string) => `https://github.com/owner/jsdom/releases/tag/v${version}`

        await ui.press({ key: 'tab-@stack' })
        await ui.press({ key: 'down' })
        await ui.press({ key: 'open' })
        await ui.press({ key: 'copy' })

        expect(runs.at(-1)).toEqual(['open', url('30.1.2')])
        expect(copies.at(-1)).toContain(`jsdom 30.1.2 is out: ${url('30.1.2')}`)

        await ui.press({ key: 'releases' })

        expect((await ui.find({ key: 'releases' }))?.props.label).toBe('Hide releases')
        expect(await headingOf(ui)).toBe('Your stack · 1-9 of 9')
        expect((await rowLinesOf(ui)).slice(1, 5)).toEqual([
          '› ⚠ jsdom 25.0.1 → 30.1.2 major breaking in 30.0.0 · 3 releases Oct 5',
          '📦 30.1.2 major Oct 5',
          '📦 30.1.1 major Sep 22',
          '⚠ 30.0.0 · jsdom 30 major breaking Sep 1',
        ])
        expect(await selectedRowOf(ui)).toBe(url('30.1.2'))

        await ui.press({ key: 'down' })
        await ui.press({ key: 'down' })

        expect(await selectedRowOf(ui)).toBe(url('30.1.1'))

        await ui.press({ key: 'open' })
        await ui.press({ key: 'copy' })
        await ui.press({ key: 'summarize' })
        await ui.press({ key: 'save' })

        expect(runs.at(-1)).toEqual(['open', url('30.1.1')])
        expect(copies.at(-1)).toContain(
          `We use jsdom 25.0.1. jsdom 30.1.1 is out: ${url('30.1.1')}`,
        )
        expect(logs.filter(line => line.startsWith('transcript: '))).toEqual([
          'transcript: v30.1.1',
          'transcript: v30.1.1 one.',
          'transcript: v30.1.1 two.',
          'transcript: v30.1.1 three.',
        ])
        expect((stored.get('saved') as { id: string }[]).map(item => item.id)).toEqual([
          Fixtures.STACK_RELEASES[4]?.id,
        ])
        expect((await ui.find({ key: 'save' }))?.props.label).toBe('Saved')

        await ui.press({ key: 'releases' })

        expect((await ui.find({ key: 'releases' }))?.props.label).toBe('Releases')
        expect(await headingOf(ui)).toBe('Your stack · 1-6 of 6')
        expect(await selectedRowOf(ui)).toBe(url('30.1.2'))
      },
    )

    test(
      `on ${surface}: the filter matches packages by name, ecosystem, level or a flag of any release, and keeps an expanded package open`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        releasesPaneOn(on)

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...PANE, surface, props: WIDE })

        await ui.press({ key: 'tab-@stack' })
        await ui.input({ key: 'filter', text: 'breaking' })

        expect(await rowLinesOf(ui)).toEqual([
          '› ⚠ jsdom 25.0.1 → 30.1.2 major breaking in 30.0.0 · 3 releases Oct 5',
        ])
        expect(
          await ui.find({ type: 'Text', text: '6 packages behind · 2 security · 1 breaking' }),
        ).toBeDefined()

        await ui.press({ key: 'releases' })
        await ui.input({ key: 'filter', text: 'npm major' })

        expect((await rowLinesOf(ui)).map(line => line.split(' ').slice(0, 3).join(' '))).toEqual([
          '› ⚠ @astrojs/node',
          '⚠ jsdom 25.0.1',
          '📦 30.1.2 major',
          '📦 30.1.1 major',
          '⚠ 30.0.0 ·',
          '📦 astro 5.18.1',
        ])

        await ui.input({ key: 'filter', text: 'pypi security' })

        expect(await packagesOf(ui)).toEqual(['requests'])
        expect(await groupsOf(ui)).toEqual(['PyPI'])
      },
    )

    test(
      `on ${surface}: a stack row takes one line, so a short pane shows twice the rows less its summary, filter and headings; expanded releases share the window`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        releasesPaneOn(on)

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        // Twelve rows less the tab row, the heading and the action row leave four two-line items: eight lines, four rows past the summary, the filter and two headings.
        const ui = await $.ui.mount({
          ...PANE,
          surface,
          props: { ...WIDE, scroll: { offset: 0, bodyRows: 12 } },
        })

        await ui.press({ key: 'tab-@stack' })

        expect(await headingOf(ui)).toBe('Your stack · 1-4 of 6')
        expect((await rowLinesOf(ui)).length).toBe(4)

        await ui.press({ key: 'down' })
        await ui.press({ key: 'releases' })

        expect(await headingOf(ui)).toBe('Your stack · 1-4 of 9')
        expect((await rowLinesOf(ui)).length).toBe(4)

        for (let press = 0; press < 3; press += 1) {
          await ui.press({ key: 'down' })
        }

        expect(await headingOf(ui)).toBe('Your stack · 3-6 of 9')
        expect(await selectedRowOf(ui)).toBe('https://github.com/owner/jsdom/releases/tag/v30.0.0')
      },
    )
  }

  for (const surface of SURFACES) {
    test(
      `on ${surface}: a package row with a later-dated backport shows and acts on its highest release`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const copies: string[] = []
        const items = [
          Fixtures.stackItemAt('pkg', '7.0.3', {
            current: '7.0.0',
            level: 'patch',
            publishedAt: '2026-10-01T00:00:00Z',
          }),
          Fixtures.stackItemAt('pkg', '8.0.0', {
            current: '7.0.0',
            level: 'major',
            publishedAt: '2026-09-01T00:00:00Z',
          }),
        ]
        const { stored } = Fixtures.bandOn(
          on,
          { ...STORE, ...Fixtures.stackStoreOf(items, { showLevel: 'all' }) },
          Fixtures.stackTreeOf(items),
        )

        on('ui.copy', ($, e) => {
          copies.push(e.text)

          return { value: { isCopied: true } }
        })

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...PANE, surface, props: WIDE })
        const url = 'https://github.com/owner/pkg/releases/tag/v8.0.0'

        await ui.press({ key: 'tab-@stack' })

        expect(await rowLinesOf(ui)).toEqual(['› 📦 pkg 7.0.0 → 8.0.0 major 2 releases Sep 1'])
        expect(await selectedRowOf(ui)).toBe(url)

        await ui.press({ key: 'copy' })
        await ui.press({ key: 'save' })

        expect(copies).toEqual([
          `We use pkg 7.0.0. pkg 8.0.0 is out: ${url}\nCheck whether it affects this project and what we'd need to change.`,
        ])
        expect((stored.get('saved') as { id: string }[]).map(item => item.id)).toEqual([
          items[1]?.id,
        ])
      },
    )
  }

  test('on mobile the stack tab draws the same package rows, summary and releases toggle, without a filter field', async ($, on) => {
    const clock = mock.clock(on)

    releasesPaneOn(on)

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const ui = await $.ui.mount({ ...PANE, surface: 'mobile', props: WIDE })

    await ui.press({ key: 'tab-@stack' })

    expect(await ui.find({ key: 'filter' })).toBeUndefined()
    expect(
      await ui.find({ type: 'Text', text: '6 packages behind · 2 security · 1 breaking' }),
    ).toBeDefined()
    expect((await rowLinesOf(ui)).length).toBe(6)

    await ui.press({ key: 'down' })
    await ui.press({ key: 'releases' })

    expect((await rowLinesOf(ui)).length).toBe(9)
    expect((await ui.find({ key: 'releases' }))?.props.label).toBe('Hide releases')
  })

  test('on mobile, which draws no Input, the stack tab shows the filter in force as text', async ($, on) => {
    const clock = mock.clock(on)

    stackPaneOn(on, {})

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const terminal = await $.ui.mount({ ...PANE, surface: 'terminal' })

    await terminal.press({ key: 'tab-@stack' })
    await terminal.input({ key: 'filter', text: 'vite' })

    const mobile = await $.ui.mount({ ...PANE, surface: 'mobile' })

    expect(await mobile.find({ key: 'filter' })).toBeUndefined()
    expect(await mobile.find({ type: 'Text', text: 'Filter: vite' })).toBeDefined()
    expect(await packagesOf(mobile)).toEqual(['vite'])
  })

  for (const surface of SURFACES) {
    test(
      `on ${surface}: a release saved from the stack tab shows "pkg current → new" in Saved and copies with the deps template`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const copies: string[] = []

        stackPaneOn(on, {})
        on('ui.copy', ($, e) => {
          copies.push(e.text)

          return { value: { isCopied: true } }
        })

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...PANE, surface })

        await ui.press({ key: 'tab-@stack' })
        await ui.press({ key: 'save' })
        await ui.press({ key: 'tab-saved' })

        expect(
          await ui.find({ type: 'Link', text: 'react 18.2.0 → 19.0.0 · React 19' }),
        ).toBeDefined()
        expect(await ui.find({ type: 'Text', text: '⚠' })).toBeDefined()
        expect(await ui.find({ type: 'Text', text: 'npm · major · breaking' })).toBeDefined()

        await ui.press({ key: 'copy' })

        expect(copies).toEqual([
          "We use react 18.2.0. react 19.0.0 is out: https://github.com/owner/react/releases/tag/v19.0.0\nCheck whether it affects this project and what we'd need to change.",
        ])
      },
    )
  }
})
