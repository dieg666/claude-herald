import type { ElementQuery, FoundElement } from 'claude-code/testing'
import { describe, expect, mock, test } from 'claude-code/testing'

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
    plugin: 'news',
    component: 'Pane',
    requestId: 'news',
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
      await $.command.run(Fixtures.newsOf('remove Beta'))

      expect((await tabsOf(ui)).map(([key]) => key)).toEqual(['tab-a', 'tab-saved'])
      expect([await headingOf(ui), await selectedOf(ui)]).toEqual([
        'Alpha · 1-3 of 3',
        'https://example.com/a/1',
      ])

      await ui.press({ key: 'down' })
      await $.command.run(Fixtures.newsOf('disable Alpha'))

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

      await $.command.run(Fixtures.newsOf('remove Alpha'))

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

      // Twenty cells less the mark, the glyph, two spaces and ` Jan 1` leave ten for a headline.
      expect(
        (await ui.findAll({ type: 'Link' })).map(link => [link.props.href, link.children.join('')]),
      ).toEqual([
        ['https://example.com/a/2', `${'b'.repeat(9)}…`],
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
})
