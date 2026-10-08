import type { ElementQuery, FoundElement } from 'claude-code/testing'
import { describe, expect, mock, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'
import Defaults from '../../hooks/defaults'
import Names from '../../hooks/names'
import Pane from '../../hooks/pane'
import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'

describe('pane-view', () => {
  const SURFACES = ['terminal', 'desktop'] as const
  const ALPHA = Fixtures.sourceAt('a', { name: 'Alpha' })
  const OFF = Fixtures.sourceAt('off', { name: 'Off', isEnabled: false })
  const BETA = Fixtures.sourceAt('b', { name: 'Beta' })

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

  // The active tab's text: spelled as a plain Button on the terminal, its text alone on a surface with native buttons.
  const activeOf = (surface: string, hotkey: string, text: string) =>
    surface === 'terminal' ? `${hotkey}: ${text}` : text

  // The active tab's look: plain text bold and underlined, in the inverse text color, over a Box filled with the text color.
  const isHighlighted = (box: FoundElement) => {
    const [text, ...rest] = box.children as FoundElement[]

    return (
      box.type === 'Box' &&
      box.props.backgroundColor === 'text' &&
      rest.length === 0 &&
      text?.type === 'Text' &&
      text.props.color === 'inverseText' &&
      text.props.bold === true &&
      text.props.underline === true
    )
  }

  // Each tab in order: its key, its text with its count token after it when it has one, its hotkey, and `dim` for a dim Button or `active` for the highlighted text the active tab is drawn as.
  const tabsOf = async (ui: Drawing) => {
    const all = await ui.findAll({})
    // The count token is the second child of the Box that holds the tab's name.
    const tokenOf = (key: string | undefined) => {
      const box = all.find(
        found =>
          found.type === 'Box' &&
          childKeyOf(found, 0) === key &&
          childOf(found, 1)?.type === 'Text',
      )

      return box === undefined ? '' : ` ${lineOf(childOf(box, 1))}`
    }

    return all
      .filter(found => found.key?.startsWith('tab-') === true)
      .map(found =>
        found.type === 'Button'
          ? [
              found.key,
              `${found.props.label}${tokenOf(found.key)}`,
              found.props.hotkey,
              found.props.dimColor === true ? 'dim' : 'lit',
            ]
          : [
              found.key,
              `${lineOf(found)}${tokenOf(found.key)}`,
              undefined,
              isHighlighted(found) ? 'active' : found.type,
            ],
      )
  }

  const keysOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Button' })).map(button => button.key)

  const linksOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Link' })).map(link => link.props.href)

  // The position at the title line's right end, undefined when none is drawn.
  const positionOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Text' })).find(
      text => text.props.color === 'suggestion' && text.text !== '›',
    )?.text

  // The headline of the selected row: the bold Text that is not the active tab's, holding a Link or the plain title.
  const selectedOf = async (ui: Drawing) => {
    const [bold] = (await ui.findAll({ type: 'Text' })).filter(
      text => text.props.bold === true && text.props.underline !== true,
    )
    const [child] = bold?.children ?? []

    return typeof child === 'string' ? child : (child as FoundElement | undefined)?.props.href
  }

  const savedOf = async (peek: () => Promise<string | undefined>) =>
    (JSON.parse((await peek()) ?? 'null') as { saved: { id: string }[] }).saved.map(item => item.id)

  // Every string a drawn node holds, its descendants' included, runs of spaces made one.
  const lineOf = (node: unknown): string => {
    const all = (child: unknown): string =>
      typeof child === 'string'
        ? child
        : ((child as { children?: unknown[] }).children ?? []).map(all).join('')

    return all(node).replace(/\s+/g, ' ').trim()
  }

  const childOf = (box: FoundElement, index: number) =>
    box.children[index] as FoundElement | undefined

  // A child as drawn carries its key among its props.
  const childKeyOf = (box: FoundElement, index: number) =>
    childOf(box, index)?.key ?? childOf(box, index)?.props.key

  // Each news row as drawn: the line's parts (the headline, then the date when it has one), and the summary lines under it.
  const newsRowsOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Box' }))
      .filter(box => box.props.flexDirection === 'row' && childOf(box, 0)?.props.flexGrow === 1)
      .map(box => box.children.map(lineOf))

  // The summary drawn under a row: the row's line parts and the summary's lines.
  const summariesOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Box' }))
      .filter(box => childOf(box, 1)?.props.paddingLeft === 4)
      .map(box => [
        (childOf(box, 0)?.children ?? []).map(lineOf),
        (childOf(box, 1)?.children ?? []).map(lineOf),
      ])

  for (const surface of SURFACES) {
    test(
      `on ${surface}: with automatic summaries off the selected item draws no summary or placeholder, even one cached; moves and tab switches ask nothing, and Summarize still asks`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const { asked, logs } = Fixtures.bandOn(on, {
          ...STORE,
          summaries: [
            {
              itemId: 'a:2',
              lang: 'feed',
              kind: 'short',
              version: Summaries.SUMMARY_PROMPT_VERSION,
              text: 'Second, in short.',
            },
          ],
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...PANE, surface })
        const shown = async () => {
          expect(await summariesOf(ui)).toEqual([])
          expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()
          expect(await ui.find({ type: 'Text', text: 'Second, in short.' })).toBeUndefined()

          return (await newsRowsOf(ui)).length
        }

        expect(await shown()).toBe(5)

        await ui.press({ key: 'tab-a' })
        await clock.settle()

        expect(await shown()).toBe(3)

        await ui.press({ key: 'down' })
        await clock.settle()

        expect(await selectedOf(ui)).toBe('https://example.com/a/2')
        expect(await shown()).toBe(3)

        await ui.press({ key: 'tab-b' })
        await clock.settle()

        expect(await shown()).toBe(2)
        expect(asked).toEqual([])

        await ui.press({ key: 'summarize' })
        await clock.settle()

        expect(asked).toEqual(['b 1'])
        expect(logs.filter(line => line.startsWith('transcript: '))).toEqual([
          'transcript: b 1',
          'transcript: b 1 one.',
          'transcript: b 1 two.',
          'transcript: b 1 three.',
        ])
        expect(await shown()).toBe(2)
      },
    )
  }

  for (const surface of SURFACES) {
    test(
      `on ${surface}: All first and active on opening, then a tab per enabled source, then Saved; every source's items one line each in the band's order, the source column first, linked and dated; the selected one's summary under it, pending or summarized`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        const { asked } = Fixtures.bandOn(on, {
          settings: Fixtures.SUMMARIES_ON,
          ...STORE,
          summaries: [
            {
              itemId: 'a:2',
              lang: 'feed',
              kind: 'short',
              version: Summaries.SUMMARY_PROMPT_VERSION,
              text: 'Second, in short.',
            },
          ],
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...PANE, surface })

        expect(await tabsOf(ui)).toEqual([
          ['tab-@all', activeOf(surface, 'l', 'All'), undefined, 'active'],
          ['tab-a', 'Alpha', '1', 'dim'],
          ['tab-b', 'Beta', '2', 'dim'],
          ['tab-saved', 'Saved', '0', 'dim'],
        ])
        expect(await positionOf(ui)).toBe('1–5 of 5')
        expect(await linksOf(ui)).toEqual([
          'https://example.com/a/1',
          'https://example.com/b/1',
          'https://example.com/a/2',
          'https://example.com/b/2',
          'https://example.com/a/3',
        ])
        expect(await newsRowsOf(ui)).toEqual([
          ['› Alpha a 1', 'Jan 2'],
          ['Beta b 1', 'Jan 2'],
          ['Alpha a 2', 'Jan 1'],
          ['Beta b 2', 'Jan 1'],
          ['Alpha a 3', 'Jan 1'],
        ])
        expect(await summariesOf(ui)).toEqual([[['› Alpha a 1', 'Jan 2'], ['…']]])
        expect(await ui.find({ type: 'Text', text: 'Second, in short.' })).toBeUndefined()
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

        await ui.press({ key: 'down' })
        await ui.press({ key: 'down' })
        await clock.settle()

        expect(await summariesOf(ui)).toEqual([[['› Alpha a 2', 'Jan 1'], ['Second, in short.']]])
        expect(asked).toEqual(['b 1'])

        await ui.press({ key: 'tab-a' })

        expect(await newsRowsOf(ui)).toEqual([
          ['› a 1', 'Jan 2'],
          ['a 2', 'Jan 1'],
          ['a 3', 'Jan 1'],
        ])
      },
    )

    test(
      `on ${surface}: an item without text, selected, is its headline row alone, with no summary or placeholder, and is never sent to the model`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const { asked, logs } = Fixtures.bandOn(on, {
          settings: Fixtures.SUMMARIES_ON,
          ...STORE,
          items: {
            ...STORE.items,
            a: Fixtures.datedItemsOf('a', 3).map(item =>
              item.id === 'a:2' ? { ...item, text: '' } : item,
            ),
          },
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...PANE, surface })
        const summaryLines = async () =>
          (await ui.findAll({ type: 'Box' })).filter(box => box.props.paddingLeft === 4).length

        await ui.press({ key: 'tab-a' })

        expect(await linksOf(ui)).toEqual([
          'https://example.com/a/1',
          'https://example.com/a/2',
          'https://example.com/a/3',
        ])
        expect(await summaryLines()).toBe(1)

        await ui.press({ key: 'tab-b' })
        await ui.press({ key: 'tab-a' })
        await clock.settle()

        const askedOfAlpha = () => asked.filter(title => title.startsWith('a ')).sort()

        expect(askedOfAlpha()).toEqual(['a 1', 'a 3'])
        expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()
        expect(await summaryLines()).toBe(1)

        await ui.press({ key: 'down' })
        await clock.settle()

        expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()
        expect(await summaryLines()).toBe(0)

        await ui.press({ key: 'summarize' })

        expect(askedOfAlpha()).toEqual(['a 1', 'a 3'])
        expect(logs.filter(line => line.startsWith('transcript: '))).toEqual([
          'transcript: a 2',
          `transcript: ${Actions.NO_TEXT_LINE}`,
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

      for (const tab of ['tab-saved', 'tab-a']) {
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
      expect(await positionOf(ui)).toBe('1–2 of 2')
      expect(await selectedOf(ui)).toBe('https://example.com/b/1')
      expect((await tabsOf(ui)).map(([key, , , look]) => [key, look])).toEqual([
        ['tab-@all', 'dim'],
        ['tab-a', 'dim'],
        ['tab-b', 'active'],
        ['tab-saved', 'dim'],
      ])

      await ui.press({ key: 'tab-a' })

      expect(await selectedOf(ui)).toBe('https://example.com/a/1')
    })

    test(`on ${surface}: the active tab is highlighted text, not a Button; the others stay dim Buttons on their hotkeys, full names where they fit, Saved last with its count`, async ($, on) => {
      mock.clock(on)

      const long = Fixtures.sourceAt('long', { name: 'Claude Code releases' })

      Fixtures.bandOn(on, {
        sources: [ALPHA, long],
        items: { a: Fixtures.datedItemsOf('a', 3), long: Fixtures.datedItemsOf('long', 1) },
        saved: Fixtures.datedItemsOf('a', 2).map((item, index) => ({ ...item, savedAt: index })),
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })

      expect(await tabsOf(ui)).toEqual([
        ['tab-@all', activeOf(surface, 'l', 'All'), undefined, 'active'],
        ['tab-a', 'Alpha', '1', 'dim'],
        ['tab-long', 'Claude Code releases', '2', 'dim'],
        ['tab-saved', 'Saved (2)', '0', 'dim'],
      ])
      expect((await ui.find({ key: 'tab-@all' }))?.type).toBe('Box')
      expect(lineOf(await ui.find({ key: 'tab-@all' }))).toBe(
        surface === 'terminal' ? 'l: All' : 'All',
      )
      expect(await ui.find({ type: 'Button', key: 'tab-@all' })).toBeUndefined()

      await ui.press({ key: 'tab-long' })

      expect(await tabsOf(ui)).toEqual([
        ['tab-@all', 'All', 'l', 'dim'],
        ['tab-a', 'Alpha', '1', 'dim'],
        ['tab-long', activeOf(surface, '2', 'Claude Code releases'), undefined, 'active'],
        ['tab-saved', 'Saved (2)', '0', 'dim'],
      ])

      await ui.press({ key: 'tab-saved' })

      expect((await tabsOf(ui)).at(-1)).toEqual([
        'tab-saved',
        activeOf(surface, '0', 'Saved (2)'),
        undefined,
        'active',
      ])

      await ui.press({ key: 'read' })

      expect((await tabsOf(ui)).at(-1)).toEqual([
        'tab-saved',
        activeOf(surface, '0', 'Saved (1)'),
        undefined,
        'active',
      ])

      await ui.press({ key: 'read' })

      // With nothing saved the count goes.
      expect((await tabsOf(ui)).at(-1)).toEqual([
        'tab-saved',
        activeOf(surface, '0', 'Saved'),
        undefined,
        'active',
      ])
    })

    test(`on ${surface}: the title line holds the selection Buttons then, at its right end, the position with an en dash, never the tab's name`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })
      // A child as drawn carries its key among its props.
      const keyOf = (child: FoundElement | undefined) => child?.key ?? child?.props.key
      const titleOf = async () =>
        (await ui.findAll({ type: 'Box' })).find(box => keyOf(childOf(box, 0)) === 'up')

      const title = await titleOf()
      const end = title === undefined ? undefined : childOf(title, 2)

      expect(title?.children.map(child => (child as FoundElement).type)).toEqual([
        'Button',
        'Button',
        'Box',
      ])
      expect(keyOf(childOf(title as FoundElement, 1))).toBe('down')
      expect([end?.props.flexGrow, end?.props.justifyContent, lineOf(end)]).toEqual([
        1,
        'flex-end',
        '1–5 of 5',
      ])
      expect(lineOf(title)).not.toContain('All')

      await ui.press({ key: 'tab-b' })

      expect(lineOf(await titleOf())).not.toContain('Beta')
      expect(await positionOf(ui)).toBe('1–2 of 2')
    })

    test(`on ${surface}: a factory source's tab uses its short label until it is renamed, a user source's its own name`, async ($, on) => {
      mock.clock(on)

      const [anthropic, code, sdk] = Defaults.FACTORY_SOURCES

      Fixtures.bandOn(on, {
        sources: [anthropic!, { ...code!, name: 'CC releases' }, sdk!, ALPHA],
        items: { 'anthropic-news': Fixtures.datedItemsOf('anthropic-news', 2) },
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({
        ...PANE,
        surface,
        props: { ...Fixtures.PANE_PROPS, bodyColumns: 100 },
      })

      expect(await tabsOf(ui)).toEqual([
        ['tab-@all', activeOf(surface, 'l', 'All'), undefined, 'active'],
        ['tab-anthropic-news', 'Anthropic', '1', 'dim'],
        ['tab-claude-code-releases', 'CC releases', '2', 'dim'],
        ['tab-claude-agent-sdk-ts', 'Agent SDK', '3', 'dim'],
        ['tab-a', 'Alpha', '4', 'dim'],
        ['tab-saved', 'Saved', '0', 'dim'],
      ])

      await ui.press({ key: 'tab-claude-agent-sdk-ts' })

      expect((await tabsOf(ui))[3]).toEqual([
        'tab-claude-agent-sdk-ts',
        activeOf(surface, '3', 'Agent SDK'),
        undefined,
        'active',
      ])
    })

    test(`on ${surface}: names are cut only where that saves a line of tabs, and the window counts the tab row's lines as drawn`, async ($, on) => {
      mock.clock(on)

      const long = Fixtures.sourceAt('long', { name: 'Claude Code releases' })

      Fixtures.bandOn(on, {
        sources: [ALPHA, BETA, long],
        items: { a: Fixtures.datedItemsOf('a', 20) },
        saved: Fixtures.datedItemsOf('b', 2).map((item, index) => ({ ...item, savedAt: index })),
      })

      await $.classic.SessionStart({ source: 'clear' })

      const mountAt = (bodyColumns: number) =>
        $.ui.mount({
          ...PANE,
          surface,
          props: { ...Fixtures.PANE_PROPS, bodyColumns, scroll: { offset: 0, bodyRows: 16 } },
        })

      // Cut, `l: All`, `1: Alpha`, `2: Beta`, `3: Claude Code rel…` and `0: Saved (2)` with four two-cell gaps take sixty cells; full, sixty-four.
      const wide = await mountAt(60)

      expect(await tabsOf(wide)).toEqual([
        ['tab-@all', activeOf(surface, 'l', 'All'), undefined, 'active'],
        ['tab-a', 'Alpha', '1', 'dim'],
        ['tab-b', 'Beta', '2', 'dim'],
        ['tab-long', 'Claude Code rel…', '3', 'dim'],
        ['tab-saved', 'Saved (2)', '0', 'dim'],
      ])
      // Sixteen rows less one tab line, the title line, two footer lines (from fifty-two cells) and three summary lines leave nine.
      expect([(await linksOf(wide)).length, await positionOf(wide)]).toEqual([9, '1–9 of 20'])

      // The active tab is spelled as wide as its Button, so switching keeps the cut names.
      await wide.press({ key: 'tab-long' })

      expect((await tabsOf(wide)).map(([key, text]) => [key, text])).toEqual([
        ['tab-@all', 'All'],
        ['tab-a', 'Alpha'],
        ['tab-b', 'Beta'],
        ['tab-long', activeOf(surface, '3', 'Claude Code rel…')],
        ['tab-saved', 'Saved (2)'],
      ])

      await wide.press({ key: 'tab-a' })
      await wide.unmount()

      // One cell less, cut names take two lines as full ones do, so the full names come back and the window loses a row; the pane keeps the tab last shown.
      const narrow = await mountAt(59)

      expect(await tabsOf(narrow)).toEqual([
        ['tab-@all', 'All', 'l', 'dim'],
        ['tab-a', activeOf(surface, '1', 'Alpha'), undefined, 'active'],
        ['tab-b', 'Beta', '2', 'dim'],
        ['tab-long', 'Claude Code releases', '3', 'dim'],
        ['tab-saved', 'Saved (2)', '0', 'dim'],
      ])
      expect([(await linksOf(narrow)).length, await positionOf(narrow)]).toEqual([8, '1–8 of 20'])
      // Without the count, `0: Saved` is four cells shorter and the cut row fits fifty-six.
      expect(Pane.paneWindowSizeOf([ALPHA, BETA, long], 56, 16)).toBe(9)
      expect(Pane.paneWindowSizeOf([ALPHA, BETA, long], 55, 16)).toBe(8)
    })

    test(`on ${surface}: a source's own tab draws no source mark; Saved draws the name dim, then the date`, async ($, on) => {
      mock.clock(on)

      const saved = Fixtures.datedItemsOf('a', 3).slice(0, 2)

      Fixtures.bandOn(on, {
        sources: [ALPHA, BETA],
        items: { a: Fixtures.datedItemsOf('a', 3), b: Fixtures.datedItemsOf('b', 2) },
        saved: [
          ...saved.map((item, index) => ({ ...item, savedAt: index })),
          { ...Fixtures.datedItemsOf('b', 1)[0], savedAt: 3 },
        ],
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })

      await ui.press({ key: 'tab-a' })

      // The source names drawn on rows, leaving out the active tab's text, which on desktop is the bare name.
      const namesOf = async (name: string) =>
        (await ui.findAll({ type: 'Text', text: new RegExp(`^${name}$`) }))
          .filter(text => text.props.underline !== true)
          .map(text => text.props.dimColor)

      expect(await namesOf('Alpha')).toEqual([])
      expect(
        (await ui.findAll({ type: 'Text' })).filter(text => text.props.color === 'claude'),
      ).toEqual([])

      await ui.press({ key: 'tab-saved' })

      // The selected row's name is not dim: dim on the highlight would not read.
      expect(await namesOf('Alpha')).toEqual([false, true])
      expect(await namesOf('Beta')).toEqual([true])
      // Each name sits in its own unshrinking Box between the headline and the seven-cell date column, so names end in one column.
      expect(await newsRowsOf(ui)).toEqual([
        ['› a 1', 'Alpha', 'Jan 2'],
        ['a 2', 'Alpha', 'Jan 1'],
        ['b 1', 'Beta', 'Jan 2'],
      ])
      expect(
        (await ui.findAll({ type: 'Box' }))
          .filter(box => box.props.flexDirection === 'row' && childOf(box, 0)?.props.flexGrow === 1)
          .map(box => [1, 2].map(index => childOf(box, index)?.props)),
      ).toEqual(
        Array(3).fill([
          { flexShrink: 0, paddingLeft: 2 },
          { flexShrink: 0, width: 7, paddingLeft: 1, justifyContent: 'flex-end' },
        ]),
      )
      expect(
        (await ui.findAll({ type: 'Text' })).filter(text => text.props.color === 'claude'),
      ).toEqual([])

      await ui.unmount()
    })

    test(`on ${surface}: a bare version tag keeps its bare title on the source's tab and leads with the source name under Saved`, async ($, on) => {
      mock.clock(on)

      const tag = { ...Fixtures.datedItemsOf('a', 1)[0], title: 'v0.3.293' }

      Fixtures.bandOn(on, {
        sources: [ALPHA],
        items: { a: [tag] },
        saved: [{ ...tag, savedAt: 1 }],
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })
      const titlesOf = async () =>
        (await ui.findAll({ type: 'Link' })).map(link => link.children.join(''))

      expect(await titlesOf()).toEqual(['v0.3.293'])

      await ui.press({ key: 'tab-saved' })

      expect(await titlesOf()).toEqual(['Alpha v0.3.293'])
      // The title already leads with the name, so none is drawn at the right end.
      expect(await ui.find({ type: 'Text', text: /^Alpha$/ })).toBeUndefined()

      await ui.unmount()
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

        await ui.press({ key: 'tab-a' })

        expect(await ui.find({ key: 'read' })).toBeUndefined()

        await ui.press({ key: 'down' })
        await ui.press({ key: 'save' })

        expect((await ui.find({ key: 'save' }))?.props.label).toBe('Saved')

        await ui.press({ key: 'tab-saved' })

        expect(await positionOf(ui)).toBe('1 of 1')
        expect(await linksOf(ui)).toEqual(['https://example.com/a/2'])
        // Saved draws no Save: its items are saved already, and r takes one off the list.
        expect(await ui.find({ key: 'save' })).toBeUndefined()
        expect((await ui.find({ key: 'read' }))?.props.hotkey).toBe('r')
        expect(stored.get('saved')).toEqual([{ ...STORE.items.a[1], savedAt: 5000 }])
        expect(await savedOf(peek)).toEqual(['a:2'])

        await ui.press({ key: 'read' })

        expect(await linksOf(ui)).toEqual([])
        expect(
          await ui.find({
            type: 'Text',
            text: 'Nothing saved yet. Press v on an item to keep it here.',
          }),
        ).toBeDefined()
        expect(await ui.find({ key: 'open' })).toBeUndefined()
        expect(stored.get('saved')).toEqual([])
        expect(await savedOf(peek)).toEqual([])
        expect(toasts).toEqual([])
      },
    )

    test(`on ${surface}: a tab whose source is removed or turned off falls back to the first, All, from the top`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })

      await ui.press({ key: 'tab-b' })
      await ui.press({ key: 'down' })
      await $.command.run(Fixtures.heraldOf('remove Beta'))

      expect((await tabsOf(ui)).map(([key, , , look]) => [key, look])).toEqual([
        ['tab-@all', 'active'],
        ['tab-a', 'dim'],
        ['tab-saved', 'dim'],
      ])
      expect([await positionOf(ui), await selectedOf(ui)]).toEqual([
        '1–3 of 3',
        'https://example.com/a/1',
      ])

      await ui.press({ key: 'tab-a' })
      await ui.press({ key: 'down' })
      await $.command.run(Fixtures.heraldOf('disable Alpha'))

      expect(await tabsOf(ui)).toEqual([
        ['tab-@all', activeOf(surface, 'l', 'All'), undefined, 'active'],
        ['tab-saved', 'Saved', '0', 'dim'],
      ])
      expect(await positionOf(ui)).toBeUndefined()
    })

    test(`on ${surface}: a long list shows a window around the selection; j and k stop at the ends`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, { sources: [ALPHA], items: { a: Fixtures.datedItemsOf('a', 20) } })

      await $.classic.SessionStart({ source: 'clear' })

      // Thirteen rows less the tab row, the heading, the footer's two lines and three summary lines leave six items.
      const ui = await $.ui.mount({
        ...PANE,
        surface,
        props: { ...Fixtures.PANE_PROPS, scroll: { offset: 0, bodyRows: 13 } },
      })

      expect(await positionOf(ui)).toBe('1–6 of 20')

      await ui.press({ key: 'up' })

      expect(await selectedOf(ui)).toBe('https://example.com/a/1')

      for (let press = 0; press < 4; press += 1) {
        await ui.press({ key: 'down' })
      }

      expect([await positionOf(ui), await selectedOf(ui)]).toEqual([
        '2–7 of 20',
        'https://example.com/a/5',
      ])

      for (let press = 0; press < 20; press += 1) {
        await ui.press({ key: 'down' })
      }

      expect([await positionOf(ui), await selectedOf(ui)]).toEqual([
        '15–20 of 20',
        'https://example.com/a/20',
      ])
      expect((await linksOf(ui)).length).toBe(6)
    })

    test(
      `on ${surface}: one line per item, the date at its right end; only the selected item has its summary, on at most three lines; entering the tab asks for the window's missing ones; moving the selection moves the summary and keeps the window`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const long = Array.from({ length: 14 }, (_, index) => `word${index + 1}`).join(' ')
        const { asked } = Fixtures.bandOn(on, {
          settings: Fixtures.SUMMARIES_ON,
          sources: [ALPHA],
          items: {
            a: Fixtures.datedItemsOf('a', 10).map(item =>
              item.id === 'a:2' ? { ...item, title: 'x'.repeat(40) } : item,
            ),
          },
          summaries: [
            {
              itemId: 'a:1',
              lang: 'feed',
              kind: 'short',
              version: Summaries.SUMMARY_PROMPT_VERSION,
              text: long,
            },
          ],
        })

        await $.classic.SessionStart({ source: 'clear' })

        // Thirty-two cells: the widest footer wraps onto four lines, so thirteen rows less the tab row, the heading, those and three summary lines leave four items.
        const ui = await $.ui.mount({
          ...PANE,
          surface,
          props: { ...Fixtures.PANE_PROPS, bodyColumns: 32, scroll: { offset: 0, bodyRows: 13 } },
        })
        const layoutOf = async () =>
          (await ui.findAll({ type: 'Box' }))
            .filter(
              box => box.props.flexDirection === 'row' && childOf(box, 0)?.props.flexGrow === 1,
            )
            .map(box => [
              childOf(box, 0)?.props.flexShrink,
              childOf(childOf(box, 0) as FoundElement, 0)?.props.wrap,
              childOf(box, 1)?.props.flexShrink,
              childOf(box, 1)?.props.width,
              childOf(box, 1)?.props.justifyContent,
            ])

        await ui.press({ key: 'tab-a' })
        await clock.settle()

        expect([...asked].sort()).toEqual(['a 3', 'a 4', 'x'.repeat(40)])
        expect(await positionOf(ui)).toBe('1–4 of 10')
        // Thirty-two cells less the mark and its space and the seven-cell date column leave twenty-three for the headline.
        expect(await newsRowsOf(ui)).toEqual([
          ['› a 1', 'Jan 2'],
          [`${'x'.repeat(22)}…`, 'Jan 1'],
          ['a 3', 'Jan 1'],
          ['a 4', 'Jan 1'],
        ])
        expect(await layoutOf()).toEqual(Array(4).fill([1, 'truncate-end', 0, 7, 'flex-end']))
        // Twenty-eight cells after the indent: fourteen words take four lines, so the third ends the summary with an ellipsis.
        expect(await summariesOf(ui)).toEqual([
          [
            ['› a 1', 'Jan 2'],
            ['word1 word2 word3 word4', 'word5 word6 word7 word8', 'word9 word10 word11 word12…'],
          ],
        ])

        await ui.press({ key: 'down' })
        await clock.settle()

        expect(asked.length).toBe(3)
        expect(await positionOf(ui)).toBe('1–4 of 10')
        expect(await summariesOf(ui)).toEqual([
          // The model's line wraps too, its forty-one-cell word cut at twenty-eight.
          [
            [`› ${'x'.repeat(22)}…`, 'Jan 1'],
            ['Summary of', 'x'.repeat(28), `${'x'.repeat(12)}.`],
          ],
        ])
        expect((await newsRowsOf(ui)).length).toBe(4)

        await ui.press({ key: 'up' })

        expect(asked.length).toBe(3)
        expect((await summariesOf(ui))[0]?.[0]).toEqual(['› a 1', 'Jan 2'])
        expect(await linksOf(ui)).toEqual([
          'https://example.com/a/1',
          'https://example.com/a/2',
          'https://example.com/a/3',
          'https://example.com/a/4',
        ])
      },
    )

    test(
      `on ${surface}: a tab switch or a window move asks once per item without a summary, the selected one first; drawing again or moving inside the window to a summarized item asks nothing`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const gone = { ...Fixtures.datedItemsOf('gone', 1)[0], savedAt: 1 }
        const { asked } = Fixtures.bandOn(on, {
          settings: Fixtures.SUMMARIES_ON,
          sources: [ALPHA, BETA],
          items: { a: Fixtures.datedItemsOf('a', 10), b: Fixtures.datedItemsOf('b', 2) },
          saved: [gone],
        })

        await $.classic.SessionStart({ source: 'clear' })

        // Thirteen rows leave a window of six items.
        const ui = await $.ui.mount({
          ...PANE,
          surface,
          props: { ...Fixtures.PANE_PROPS, scroll: { offset: 0, bodyRows: 13 } },
        })

        await ui.redraw()
        await clock.settle()

        expect(asked).toEqual([])

        await ui.press({ key: 'tab-b' })
        await clock.settle()

        expect(asked).toEqual(['b 1', 'b 2'])
        expect(await ui.find({ type: 'Text', text: 'Summary of b 1.' })).toBeDefined()
        expect(await ui.find({ type: 'Text', text: 'Summary of b 2.' })).toBeUndefined()

        await ui.press({ key: 'down' })
        await ui.redraw()
        await clock.settle()

        expect(asked.length).toBe(2)
        expect(await ui.find({ type: 'Text', text: 'Summary of b 2.' })).toBeDefined()

        await ui.press({ key: 'tab-a' })
        await clock.settle()

        expect(asked[2]).toBe('a 1')
        expect(asked.slice(2).sort()).toEqual(['a 1', 'a 2', 'a 3', 'a 4', 'a 5', 'a 6'])

        for (let press = 0; press < 3; press += 1) {
          await ui.press({ key: 'down' })
        }

        await clock.settle()

        expect(asked.length).toBe(8)

        await ui.press({ key: 'down' })
        await clock.settle()

        expect(asked.slice(8)).toEqual(['a 7'])

        await ui.press({ key: 'tab-saved' })
        await clock.settle()

        expect(asked.slice(9)).toEqual(['gone 1'])
        expect(await ui.find({ type: 'Text', text: 'Summary of gone 1.' })).toBeDefined()
        // A removed source has no name to draw.
        expect(await ui.find({ type: 'Text', text: /^\*$/ })).toBeUndefined()
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
          settings: Fixtures.SUMMARIES_ON,
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

        // Thirty-one rows less the tab row, the heading, the footer's two lines and three summary lines leave twenty-four items.
        const ui = await $.ui.mount({
          ...PANE,
          surface,
          props: { ...Fixtures.PANE_PROPS, scroll: { offset: 0, bodyRows: 31 } },
        })

        expect(await positionOf(ui)).toBe('1–24 of 30')

        await $.command.run(Fixtures.heraldOf(''))
        await clock.settle()
        await ui.redraw()
        await clock.settle()

        expect([...asked].sort()).toEqual(titlesTo(24))
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
          settings: Fixtures.SUMMARIES_ON,
          sources: [ALPHA],
          items: { a: items },
          summaries: items.map(item => ({
            itemId: item.id,
            lang: 'feed',
            kind: 'short',
            version: Summaries.SUMMARY_PROMPT_VERSION,
            text: `Cached ${item.title}.`,
          })),
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...PANE, surface })

        expect(await ui.find({ type: 'Text', text: 'Cached a 1.' })).toBeDefined()

        await $.command.run(Fixtures.heraldOf('lang fr'))
        await clock.settle()

        expect([...new Set(asked)].sort()).toEqual(items.map(item => item.title).sort())
        expect(await ui.find({ type: 'Text', text: 'Summary of a 1.' })).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()
      },
    )

    test(`on ${surface}: only the first nine sources get digit hotkeys; Saved keeps 0`, async ($, on) => {
      mock.clock(on)

      const sources = Array.from({ length: 10 }, (_, index) => Fixtures.sourceAt(`s${index + 1}`))

      Fixtures.bandOn(on, { sources, items: {} })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })

      // The active All tab is text that still spells its letter; the sources are Buttons on their digits.
      expect((await tabsOf(ui)).map(([key, text, hotkey]) => [key, text, hotkey])).toEqual([
        ['tab-@all', activeOf(surface, 'l', 'All'), undefined],
        ...sources
          .slice(0, 9)
          .map((source, index) => [`tab-${source.id}`, source.id, String(index + 1)]),
        ['tab-s10', 's10', undefined],
        ['tab-saved', 'Saved', '0'],
      ])

      await ui.press({ key: 'tab-s10' })

      expect((await tabsOf(ui)).at(-2)).toEqual(['tab-s10', 's10', undefined, 'active'])
      expect(
        await ui.find({
          type: 'Text',
          text: 'Nothing from s10 yet. Herald checks it every 5 min.',
        }),
      ).toBeDefined()
    })

    test(`on ${surface}: an empty source tab, an empty Saved and no sources at all draw a line and no actions`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, { sources: [ALPHA], items: {} })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })

      expect(await positionOf(ui)).toBeUndefined()
      expect(
        await ui.find({
          type: 'Text',
          text: 'Nothing from any source yet. Herald checks the sources every 5 min.',
        }),
      ).toBeDefined()
      expect(await keysOf(ui)).toEqual(['tab-a', 'tab-saved', 'up', 'down'])

      await ui.press({ key: 'tab-a' })

      expect(
        await ui.find({
          type: 'Text',
          text: 'Nothing from Alpha yet. Herald checks it every 5 min.',
        }),
      ).toBeDefined()
      expect(await keysOf(ui)).toEqual(['tab-@all', 'tab-saved', 'up', 'down'])

      await ui.press({ key: 'tab-saved' })

      expect(
        await ui.find({
          type: 'Text',
          text: 'Nothing saved yet. Press v on an item to keep it here.',
        }),
      ).toBeDefined()
      expect(await ui.find({ key: 'read' })).toBeUndefined()

      await $.command.run(Fixtures.heraldOf('remove Alpha'))

      expect(await tabsOf(ui)).toEqual([
        ['tab-@all', 'All', 'l', 'dim'],
        ['tab-saved', activeOf(surface, '0', 'Saved'), undefined, 'active'],
      ])
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

      await ui.press({ key: 'tab-a' })

      // Twenty cells less the mark and its space and the seven-cell date column leave eleven for a headline.
      expect(
        (await ui.findAll({ type: 'Link' })).map(link => [link.props.href, link.children.join('')]),
      ).toEqual([
        ['https://example.com/a/2', `${'b'.repeat(10)}…`],
        ['https://example.com/a/3', `${'漢'.repeat(5)}…`],
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

  // The addresses of the headlines drawn dim, in order.
  const dimLinksOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Text' }))
      .filter(text => text.props.dimColor === true)
      .flatMap(text => text.children as FoundElement[])
      .filter(child => typeof child === 'object' && child.type === 'Link')
      .map(link => link.props.href)

  const copyOn = (on: Parameters<typeof Fixtures.bandOn>[0]) =>
    on('ui.copy', () => ({ value: { isCopied: true } }))

  for (const surface of SURFACES) {
    test(
      `on ${surface}: an item copied for Claude is drawn dim once another row is selected, on its tab and on Saved; the selected row is drawn as selected`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        mock.clock(on)

        const { stored } = Fixtures.bandOn(on, STORE)

        copyOn(on)

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...PANE, surface })

        await ui.press({ key: 'tab-a' })
        await ui.press({ key: 'save' })
        await ui.press({ key: 'copy' })

        expect(stored.get('read')).toEqual({ a: ['a:1'] })
        expect(await dimLinksOf(ui)).toEqual([])
        expect(await selectedOf(ui)).toBe('https://example.com/a/1')

        await ui.press({ key: 'down' })

        expect(await dimLinksOf(ui)).toEqual(['https://example.com/a/1'])
        expect(await selectedOf(ui)).toBe('https://example.com/a/2')

        await ui.press({ key: 'save' })
        await ui.press({ key: 'tab-saved' })

        expect(await linksOf(ui)).toEqual(['https://example.com/a/2', 'https://example.com/a/1'])
        expect(await dimLinksOf(ui)).toEqual(['https://example.com/a/1'])
      },
    )

    test(
      `on ${surface}: a source tab counts the items that arrived since it was last shown and All adds them up; showing the source tab clears its count`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        mock.clock(on)

        const { stored } = Fixtures.bandOn(on, {
          ...STORE,
          viewed: { a: ['a:1', 'a:2', 'a:3'], b: ['b:2'] },
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...PANE, surface })

        expect(await tabsOf(ui)).toEqual([
          ['tab-@all', activeOf(surface, 'l', 'All •1'), undefined, 'active'],
          ['tab-a', 'Alpha', '1', 'dim'],
          ['tab-b', 'Beta •1', '2', 'dim'],
          ['tab-saved', 'Saved', '0', 'dim'],
        ])

        await ui.press({ key: 'tab-b' })

        expect(await tabsOf(ui)).toEqual([
          ['tab-@all', 'All', 'l', 'dim'],
          ['tab-a', 'Alpha', '1', 'dim'],
          ['tab-b', activeOf(surface, '2', 'Beta'), undefined, 'active'],
          ['tab-saved', 'Saved', '0', 'dim'],
        ])
        expect((stored.get('viewed') as Record<string, string[]>).b).toEqual(['b:1', 'b:2'])

        await ui.press({ key: 'tab-a' })

        expect((await tabsOf(ui))[2]).toEqual(['tab-b', 'Beta', '2', 'dim'])
      },
    )

    test(
      `on ${surface}: a count is a token of its own after the tab's name: new items a bullet in the accent color, a total in parentheses, dim`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        mock.clock(on)
        Fixtures.bandOn(on, {
          ...STORE,
          viewed: { a: ['a:1', 'a:2', 'a:3'], b: ['b:2'] },
          saved: Fixtures.datedItemsOf('a', 2).map((item, index) => ({ ...item, savedAt: index })),
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...PANE, surface })
        // Each count token with the key of the tab it follows, its color and whether it is dim.
        const tokensOf = async () =>
          (await ui.findAll({ type: 'Box' }))
            .filter(
              box =>
                childOf(box, 1)?.type === 'Text' && String(childKeyOf(box, 0)).startsWith('tab-'),
            )
            .map(box => {
              const token = childOf(box, 1)

              return [
                childKeyOf(box, 0),
                lineOf(token),
                token?.props.color,
                token?.props.dimColor,
                box.props.columnGap,
              ]
            })

        expect(await tokensOf()).toEqual([
          ['tab-@all', '•1', 'claude', undefined, 1],
          ['tab-b', '•1', 'claude', undefined, 1],
          ['tab-saved', '(2)', undefined, true, 1],
        ])
        // The Button's label is the name alone: the token is beside it, not in it.
        expect((await ui.find({ type: 'Button', key: 'tab-b' }))?.props.label).toBe('Beta')

        // The active tab keeps its token outside the fill.
        await ui.press({ key: 'tab-saved' })

        const active = (await ui.findAll({ type: 'Box' })).find(
          box => childKeyOf(box, 0) === 'tab-saved',
        )

        expect(isHighlighted(childOf(active as FoundElement, 0) as FoundElement)).toBe(true)
        expect(lineOf(childOf(active as FoundElement, 0))).toBe(activeOf(surface, '0', 'Saved'))
        expect(lineOf(childOf(active as FoundElement, 1))).toBe('(2)')
      },
    )

    test(
      `on ${surface}: the window counts a tab row that a new count wraps, and gets the line back once the count clears`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        mock.clock(on)
        Fixtures.bandOn(on, {
          sources: [ALPHA, BETA],
          items: { a: Fixtures.datedItemsOf('a', 30), b: Fixtures.datedItemsOf('b', 2) },
          viewed: { a: Fixtures.datedItemsOf('a', 10).map(item => item.id), b: [] },
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({
          ...PANE,
          surface,
          props: { ...Fixtures.PANE_PROPS, bodyColumns: 40, scroll: { offset: 0, bodyRows: 30 } },
        })
        const sizeOf = (counts: Record<string, number>) =>
          Pane.paneWindowSizeOf([ALPHA, BETA], 40, 30, undefined, [], counts)

        // `l: All •22  1: Alpha •20  2: Beta •2  0: Saved` takes forty-five cells and wraps; without the counts it takes thirty-five.
        expect(sizeOf({ a: 20, b: 2 })).toBe(sizeOf({}) - 1)
        expect(sizeOf({})).toBeLessThan(30)
        expect((await linksOf(ui)).length).toBe(sizeOf({ a: 20, b: 2 }))

        await ui.press({ key: 'tab-b' })
        await ui.press({ key: 'tab-a' })

        expect((await tabsOf(ui)).map(([key, text]) => [key, text])).toEqual([
          ['tab-@all', 'All'],
          ['tab-a', activeOf(surface, '1', 'Alpha')],
          ['tab-b', 'Beta'],
          ['tab-saved', 'Saved'],
        ])
        expect((await linksOf(ui)).length).toBe(sizeOf({}))
      },
    )

    for (const source of ['clear', 'resume'] as const) {
      test(
        `on ${surface}: read items and new counts come back from the store after ${source}`,
        { timeoutMs: 20_000 },
        async ($, on) => {
          mock.clock(on)
          Fixtures.bandOn(on, {
            ...STORE,
            read: { a: ['a:2'] },
            viewed: { a: ['a:2', 'a:3'], b: [] },
          })

          await $.classic.SessionStart({ source })

          const ui = await $.ui.mount({ ...PANE, surface })

          expect(await dimLinksOf(ui)).toEqual(['https://example.com/a/2'])
          expect(await tabsOf(ui)).toEqual([
            ['tab-@all', activeOf(surface, 'l', 'All •3'), undefined, 'active'],
            ['tab-a', 'Alpha •1', '1', 'dim'],
            ['tab-b', 'Beta •2', '2', 'dim'],
            ['tab-saved', 'Saved', '0', 'dim'],
          ])

          await ui.press({ key: 'tab-a' })

          expect(await dimLinksOf(ui)).toEqual(['https://example.com/a/2'])
        },
      )
    }
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
          ['tab-@all', activeOf(surface, 'l', 'All'), undefined, 'active'],
          ['tab-a', 'Alpha', '1', 'dim'],
          ['tab-b', 'Beta', '2', 'dim'],
          ['tab-@stack', 'Your stack (4)', 'y', 'dim'],
          ['tab-saved', 'Saved', '0', 'dim'],
        ])

        await ui.press({ key: 'tab-@stack' })

        expect(await positionOf(ui)).toBe('1–4 of 4')
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

        expect(
          await ui.find({
            type: 'Text',
            text: 'No package matches "zzz". Clear the filter to see all.',
          }),
        ).toBeDefined()

        await ui.input({ key: 'filter', text: '', kind: 'change' })

        expect(await packagesOf(ui)).toEqual(['react', 'zod', 'vite', 'requests'])

        const hotkeys = (await ui.findAll({ type: 'Button' })).map(button => button.props.hotkey)

        expect(new Set(hotkeys).size).toBe(hotkeys.length)
      },
    )

    test(
      `on ${surface}: the stack tab shows the project's show level`,
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
      `on ${surface}: with the stack off its tab lists nothing and says how to turn it on; the other tabs stay`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        stackPaneOn(on, { isEnabled: false })

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...PANE, surface })

        expect((await tabsOf(ui)).map(([key, text]) => [key, text])).toEqual([
          ['tab-@all', activeOf(surface, 'l', 'All')],
          ['tab-a', 'Alpha'],
          ['tab-b', 'Beta'],
          ['tab-@stack', 'Your stack'],
          ['tab-saved', 'Saved'],
        ])
        // All lists no release of a stack that is off.
        expect(await linksOf(ui)).toEqual([
          'https://example.com/a/1',
          'https://example.com/b/1',
          'https://example.com/a/2',
          'https://example.com/b/2',
          'https://example.com/a/3',
        ])

        await ui.press({ key: 'tab-@stack' })

        expect(await linksOf(ui)).toEqual([])
        expect(
          await ui.find({
            type: 'Text',
            text: 'Your stack is off in this project. /herald deps on turns it on.',
          }),
        ).toBeDefined()
        expect(await ui.find({ key: 'open' })).toBeUndefined()
        expect(await ui.find({ key: 'filter' })).toBeUndefined()
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

  // The stack tab's rows as one line each: the row's text, then its date column, runs of spaces made one.
  const rowLinesOf = async (ui: Drawing) =>
    (await newsRowsOf(ui)).map(parts => parts.join(' ').replace(/\s+/g, ' ').trim())

  const WIDE = { ...Fixtures.PANE_PROPS, bodyColumns: 120 }

  // The link of the selected stack row: the bold headline, not an ecosystem heading.
  const selectedRowOf = async (ui: Drawing) => {
    const [bold] = (await ui.findAll({ type: 'Text' })).filter(
      text =>
        text.props.bold === true &&
        text.props.underline !== true &&
        (text.props.color === undefined || text.props.color === 'inverseText'),
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

        expect(await positionOf(ui)).toBe('1–6 of 6')
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

        // The selected row (the first) is drawn inverse, so its changed part carries no level color.
        expect(changed).toEqual([
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
      `on ${surface}: a date less than a day old shows as an age on All, a source tab and Saved, an older one as its date, in the one date column`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on, { now: Date.UTC(2026, 0, 2, 0, 30) })
        const [first, second] = Fixtures.datedItemsOf('a', 2)
        const edge = {
          ...first!,
          id: 'a:edge',
          title: 'edge',
          publishedAt: new Date(Date.UTC(2026, 0, 2, 0, 30) - 86_400_000 + 60_000).toISOString(),
        }
        const day = {
          ...first!,
          id: 'a:day',
          title: 'day',
          publishedAt: new Date(Date.UTC(2026, 0, 2, 0, 30) - 86_400_000).toISOString(),
        }
        const items = [first!, second!, edge, day]

        Fixtures.bandOn(on, {
          sources: [ALPHA],
          items: { a: items },
          saved: items.map((item, index) => ({ ...item, savedAt: index })),
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...PANE, surface })
        // Each row's title and date, and the date column's layout: the row's second child, unshrinking and right-aligned in seven cells.
        const datesOf = async () =>
          Object.fromEntries(
            (await newsRowsOf(ui)).map(parts => [
              parts[0]?.replace('› ', '').replace(/^Alpha /, ''),
              parts.at(-1),
            ]),
          )
        const columnsOf = async () =>
          (await ui.findAll({ type: 'Box' }))
            .filter(
              box => box.props.flexDirection === 'row' && childOf(box, 0)?.props.flexGrow === 1,
            )
            .map(box => childOf(box, box.children.length - 1)?.props)
        const expected = { 'a 1': '30m', 'a 2': '1h', edge: '23h', day: 'Jan 1' }

        // All is the tab the pane opens on.
        for (const key of [undefined, 'tab-a', 'tab-saved']) {
          if (key !== undefined) {
            await ui.press({ key })
            await clock.settle()
          }

          expect(await datesOf()).toEqual(expected)
          expect(await columnsOf()).toEqual(
            Array(4).fill({ flexShrink: 0, width: 7, paddingLeft: 1, justifyContent: 'flex-end' }),
          )
        }

        await ui.unmount()
      },
    )

    test(
      `on ${surface}: on Your stack a date less than a day old shows as an age, and every date sits in the same right-aligned column as on the other tabs`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on, { now: Date.UTC(2026, 9, 8, 12) })

        releasesPaneOn(on)

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...PANE, surface, props: WIDE })

        await ui.press({ key: 'tab-@stack' })

        expect(await rowLinesOf(ui)).toEqual([
          '› ⚠ @astrojs/node 9.5.5 → 11.1.7 major security Oct 6',
          '⚠ jsdom 25.0.1 → 30.1.2 major breaking in 30.0.0 · 3 releases Oct 5',
          '📦 astro 5.18.1 → 7.3.7 major Oct 7',
          '📦 @fortawesome/fontawesome-svg-core 7.1.0 → 7.3.1 minor 2 releases Jul 15',
          '📦 left-pad 1.0.0 → canary 12h',
          '⚠ requests 2.31.0 → 2.31.1 patch security Apr 1',
        ])

        // Every row is the headline's growing Box, then the date in an unshrinking seven-cell Box at the right end, as on the source tabs.
        const rows = (await ui.findAll({ type: 'Box' })).filter(
          box => box.props.flexDirection === 'row' && childOf(box, 0)?.props.flexGrow === 1,
        )

        expect(rows).toHaveLength(6)
        expect(rows.map(box => box.children.length)).toEqual(Array(6).fill(2))
        expect(rows.map(box => childOf(box, 1)?.props)).toEqual(
          Array(6).fill({ flexShrink: 0, width: 7, paddingLeft: 1, justifyContent: 'flex-end' }),
        )
        // The date is not part of the growing text, which holds the cells and so ends before the date column.
        expect(rows.map(box => lineOf(childOf(box, 0)))).not.toContainEqual(
          expect.stringMatching(/\d{1,2}h$|Oct \d$/),
        )

        await ui.press({ key: 'releases' })
        await ui.press({ key: 'down' })

        const expanded = (await ui.findAll({ type: 'Box' })).filter(
          box => box.props.flexDirection === 'row' && childOf(box, 0)?.props.flexGrow === 1,
        )

        expect(expanded.every(box => childOf(box, 1)?.props.width === 7)).toBe(true)

        await ui.unmount()
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
        expect(await positionOf(ui)).toBe('1–9 of 9')
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
        expect(await positionOf(ui)).toBe('1–6 of 6')
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
      `on ${surface}: a stack row takes one line, so a short pane shows every line its body has less its summary, filter and headings; expanded releases share the window`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        releasesPaneOn(on)

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        // Twelve rows less the tab row, the heading and the action row leave nine lines, five rows past the summary, the filter and two headings.
        const ui = await $.ui.mount({
          ...PANE,
          surface,
          props: { ...WIDE, scroll: { offset: 0, bodyRows: 12 } },
        })

        await ui.press({ key: 'tab-@stack' })

        expect(await positionOf(ui)).toBe('1–5 of 6')
        expect((await rowLinesOf(ui)).length).toBe(5)

        await ui.press({ key: 'down' })
        await ui.press({ key: 'releases' })

        expect(await positionOf(ui)).toBe('1–5 of 9')
        expect((await rowLinesOf(ui)).length).toBe(5)

        for (let press = 0; press < 3; press += 1) {
          await ui.press({ key: 'down' })
        }

        expect(await positionOf(ui)).toBe('3–7 of 9')
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

  test('on mobile the news tabs draw the same one-line rows, the date at the right end, and the selected summary only', async ($, on) => {
    mock.clock(on)
    Fixtures.bandOn(on, {
      settings: Fixtures.SUMMARIES_ON,
      ...STORE,
      summaries: [
        {
          itemId: 'a:1',
          lang: 'feed',
          kind: 'short',
          version: Summaries.SUMMARY_PROMPT_VERSION,
          text: 'First, in short.',
        },
      ],
    })

    await $.classic.SessionStart({ source: 'clear' })

    const ui = await $.ui.mount({ ...PANE, surface: 'mobile' })

    await ui.press({ key: 'tab-a' })

    expect(await newsRowsOf(ui)).toEqual([
      ['› a 1', 'Jan 2'],
      ['a 2', 'Jan 1'],
      ['a 3', 'Jan 1'],
    ])
    expect(await summariesOf(ui)).toEqual([[['› a 1', 'Jan 2'], ['First, in short.']]])

    await ui.press({ key: 'down' })

    expect((await summariesOf(ui))[0]?.[0]).toEqual(['› a 2', 'Jan 1'])
  })

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

  // Every Text under a drawn node, the node's own included.
  const textsIn = (node: unknown): FoundElement[] => {
    const element = node as Partial<FoundElement> | null

    return typeof element !== 'object' || element === null || element.props === undefined
      ? []
      : [
          ...(element.type === 'Text' ? [element as FoundElement] : []),
          ...(element.children ?? []).flatMap(textsIn),
        ]
  }

  // Whether a Text holds no other Text, so it is one part of a row, not the line around the parts.
  const isPart = (text: FoundElement) => !text.children.some(child => textsIn(child).length > 0)

  // Whether a Box is a row drawn as selected: filled with the text color, and not the active tab.
  const isFilledRow = (box: FoundElement) =>
    box.props.backgroundColor === 'text' && box.key?.startsWith('tab-') !== true

  // The rows drawn as selected, as one line each.
  const filledRowsOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Box' })).filter(isFilledRow).map(box => lineOf(box))

  // The strings of every Text in the inverse text color below the tab row, whose active tab is the one underlined Text.
  const inverseTextsOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Text' }))
      .filter(
        text => text.props.color === 'inverseText' && text.props.underline !== true && isPart(text),
      )
      .map(text => lineOf(text))

  // Whether every Text of every filled row is in the inverse text color and none is dim.
  const isFilledRowsInverse = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Box' }))
      .filter(isFilledRow)
      .flatMap(textsIn)
      .every(text => text.props.color === 'inverseText' && text.props.dimColor !== true)

  for (const surface of SURFACES) {
    test(`on ${surface}: the selected news row, on All and on a source tab, is filled and its Texts inverse across source column, headline and date, the summary stays dim, and moving the selection moves the highlight`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, { ...STORE, settings: Fixtures.SUMMARIES_ON })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })

      expect(await filledRowsOf(ui)).toEqual(['› Alpha a 1Jan 2'])
      expect(await inverseTextsOf(ui)).toEqual(['›', 'Alpha', 'a 1', 'Jan 2'])
      expect(await isFilledRowsInverse(ui)).toBe(true)
      expect(await ui.find({ type: 'Text', text: '…' })).toMatchObject({
        props: { dimColor: true },
      })

      await ui.press({ key: 'down' })

      expect(await filledRowsOf(ui)).toEqual(['› Beta b 1Jan 2'])
      expect(await inverseTextsOf(ui)).toEqual(['›', 'Beta', 'b 1', 'Jan 2'])

      await ui.press({ key: 'down' })

      expect(await filledRowsOf(ui)).toEqual(['› Alpha a 2Jan 1'])

      await ui.press({ key: 'up' })

      expect(await filledRowsOf(ui)).toEqual(['› Beta b 1Jan 2'])

      await ui.press({ key: 'tab-a' })

      expect(await filledRowsOf(ui)).toEqual(['› a 1Jan 2'])
      expect(await inverseTextsOf(ui)).toEqual(['›', 'a 1', 'Jan 2'])
      expect(await isFilledRowsInverse(ui)).toBe(true)

      await ui.press({ key: 'down' })

      expect(await filledRowsOf(ui)).toEqual(['› a 2Jan 1'])
      expect(await inverseTextsOf(ui)).toEqual(['›', 'a 2', 'Jan 1'])
    })

    test(`on ${surface}: on Saved the selected row's source name and date are inverse with its headline, and the others are not`, async ($, on) => {
      mock.clock(on)

      const saved = Fixtures.datedItemsOf('a', 3).slice(0, 2)

      Fixtures.bandOn(on, {
        sources: [ALPHA],
        items: { a: Fixtures.datedItemsOf('a', 3) },
        saved: saved.map((item, index) => ({ ...item, savedAt: index })),
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...PANE, surface })

      await ui.press({ key: 'tab-saved' })

      expect(await filledRowsOf(ui)).toEqual(['› a 1AlphaJan 2'])
      expect(await inverseTextsOf(ui)).toEqual(['›', 'a 1', 'Alpha', 'Jan 2'])
      expect(await isFilledRowsInverse(ui)).toBe(true)
      expect(
        (await ui.findAll({ type: 'Text', text: /^Alpha$/ })).map(text => text.props.dimColor),
      ).toEqual([false, true])

      await ui.press({ key: 'down' })

      expect(await filledRowsOf(ui)).toEqual(['› a 2AlphaJan 1'])
    })

    test(`on ${surface}: the selected Your stack row is filled whole, a release under its package too, and moving the selection moves it`, async ($, on) => {
      const clock = mock.clock(on)

      releasesPaneOn(on)

      await $.session.start(Fixtures.SESSION)
      await clock.settle()

      const ui = await $.ui.mount({ ...PANE, surface, props: WIDE })

      await ui.press({ key: 'tab-@stack' })

      expect(await filledRowsOf(ui)).toHaveLength(1)
      expect((await filledRowsOf(ui))[0]).toMatch(/^› ⚠ @astrojs\/node.*9\.5\.5 → 11\.1\.7.*Oct 6$/)
      expect(await isFilledRowsInverse(ui)).toBe(true)
      expect(await inverseTextsOf(ui)).toContain('11.1.7')

      await ui.press({ key: 'down' })

      expect(await filledRowsOf(ui)).toHaveLength(1)
      expect((await filledRowsOf(ui))[0]).toMatch(/^› ⚠ jsdom.*Oct 5$/)

      await ui.press({ key: 'releases' })
      await ui.press({ key: 'down' })

      const rows = await filledRowsOf(ui)

      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatch(/^› 📦 30\.1\.2.*major.*Oct 5$/)
      expect(await isFilledRowsInverse(ui)).toBe(true)
      expect(
        (await ui.findAll({ type: 'Text' })).filter(text => text.props.color === 'error'),
      ).not.toEqual([])
    })

    test(`on ${surface}: a selected Your stack package row and a selected release row draw no summary line`, async ($, on) => {
      const clock = mock.clock(on)

      releasesPaneOn(on)

      await $.session.start(Fixtures.SESSION)
      await clock.settle()

      const ui = await $.ui.mount({ ...PANE, surface, props: WIDE })

      // A summary sits in a Box indented under its row; its placeholder is a dim "…".
      const summaryOf = async () => [
        await ui.findAll({ type: 'Text', text: /^…$/ }),
        (await ui.findAll({ type: 'Box' })).filter(box => box.props.paddingLeft === 4),
      ]

      await ui.press({ key: 'tab-@stack' })

      expect(await summaryOf()).toEqual([[], []])

      await ui.press({ key: 'down' })
      await ui.press({ key: 'releases' })
      await ui.press({ key: 'down' })

      expect((await filledRowsOf(ui))[0]).toMatch(/^› 📦 30\.1\.2/)
      expect(await summaryOf()).toEqual([[], []])
    })
  }

  // A child as drawn carries its key among its props.
  const footerKeyOf = (child: unknown) =>
    (child as FoundElement | undefined)?.key ?? (child as FoundElement | undefined)?.props.key

  // The footer as drawn: the hint's text, then each Button's key, label and hotkey; undefined with no footer.
  const footerOf = async (ui: Drawing) =>
    (await ui.find({ key: 'footer' }))?.children.map(child => {
      const found = child as FoundElement

      return found.type === 'Text'
        ? [lineOf(found), found.props.dimColor === true ? 'dim' : 'lit']
        : [footerKeyOf(found), found.props.label, found.props.hotkey]
    })

  const NEWS_KEYS = [
    ['open', 'Open', 'o'],
    ['summarize', 'Summarize', 's'],
    ['save', 'Save', 'v'],
    ['copy', 'Copy for Claude', 'c'],
  ]

  for (const surface of SURFACES) {
    test(`on ${surface}: unfocused, the footer leads with "ctrl+x tab to use these keys:"; focused, it shows the keys alone; the window is the same either way`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, { sources: [ALPHA], items: { a: Fixtures.datedItemsOf('a', 20) } })

      await $.classic.SessionStart({ source: 'clear' })

      const mountWith = (isFocused: boolean) =>
        $.ui.mount({
          ...PANE,
          surface,
          props: { ...Fixtures.PANE_PROPS, isFocused, scroll: { offset: 0, bodyRows: 13 } },
        })

      const away = await mountWith(false)

      expect(await footerOf(away)).toEqual([['ctrl+x tab to use these keys:', 'dim'], ...NEWS_KEYS])
      // Thirteen rows less the tab row, the heading, the footer's two lines and three summary lines leave six.
      expect([await positionOf(away), (await linksOf(away)).length]).toEqual(['1–6 of 20', 6])

      // A press still reaches an unfocused footer's Button, as a click does.
      await away.press({ key: 'save' })

      expect((await away.find({ key: 'save' }))?.props.label).toBe('Saved')

      await away.unmount()

      const held = await mountWith(true)

      expect(await footerOf(held)).toEqual([
        ['open', 'Open', 'o'],
        ['summarize', 'Summarize', 's'],
        ['save', 'Saved', 'v'],
        ['copy', 'Copy for Claude', 'c'],
      ])
      expect(await held.find({ type: 'Text', text: /ctrl\+x tab/ })).toBeUndefined()
      expect([await positionOf(held), (await linksOf(held)).length]).toEqual(['1–6 of 20', 6])
    })

    test(`on ${surface}: the footer is pinned under the rows: the rows take the free room, so a short tab leaves it above the footer`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({
        ...PANE,
        surface,
        props: { ...Fixtures.PANE_PROPS, isFocused: false },
      })
      const root = (await ui.findAll({ type: 'Box' })).find(box =>
        box.children.some(child => footerKeyOf(child) === 'footer'),
      ) as FoundElement
      const [rows, footer] = root.children.slice(-2) as FoundElement[]

      // Docked, the tree is at least as tall as the body, so the growing rows push the footer to the last row.
      expect([root.props.flexDirection, root.props.flexGrow, root.props.minHeight]).toEqual([
        'column',
        1,
        40,
      ])
      expect([footerKeyOf(rows), rows?.props.flexGrow, rows?.props.flexDirection]).toEqual([
        'rows',
        1,
        'column',
      ])
      expect([footerKeyOf(footer), footer?.props.flexShrink]).toEqual(['footer', 0])
      // Every row sits in the growing Box, none after the footer.
      expect((await newsRowsOf(ui)).length).toBe(5)
      expect(lineOf(rows)).toContain('a 3')
      expect(lineOf(footer)).not.toContain('a 3')

      await ui.unmount()

      // Inline the frame fits the tree, so it fills nothing.
      const inline = await $.ui.mount({
        ...PANE,
        surface,
        props: { ...Fixtures.PANE_PROPS, placement: 'inline' },
      })
      const fitted = (await inline.findAll({ type: 'Box' })).find(box =>
        box.children.some(child => footerKeyOf(child) === 'footer'),
      )

      expect(fitted?.props.minHeight).toBeUndefined()
      expect(footerKeyOf(fitted?.children.at(-1))).toBe('footer')
    })

    test(`on ${surface}: the footer shows only the keys that act on the tab: Saved has r in place of v, Your stack adds e, an empty tab none`, async ($, on) => {
      const clock = mock.clock(on)

      Fixtures.bandOn(on, {
        ...STORE,
        items: { ...STORE.items, b: [] },
        saved: [{ ...STORE.items.a[2], savedAt: 1 }],
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({
        ...PANE,
        surface,
        props: { ...Fixtures.PANE_PROPS, isFocused: false },
      })

      expect((await footerOf(ui))?.slice(1)).toEqual(NEWS_KEYS)

      await ui.press({ key: 'tab-saved' })

      expect(await footerOf(ui)).toEqual([
        ['ctrl+x tab to use these keys:', 'dim'],
        ['open', 'Open', 'o'],
        ['summarize', 'Summarize', 's'],
        ['copy', 'Copy for Claude', 'c'],
        ['read', 'Mark as read', 'r'],
      ])

      await ui.press({ key: 'tab-b' })
      await clock.settle()

      expect(
        await ui.find({
          type: 'Text',
          text: 'Nothing from Beta yet. Herald checks it every 5 min.',
        }),
      ).toBeDefined()
      expect(await footerOf(ui)).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: /ctrl\+x tab/ })).toBeUndefined()
    })

    test(
      `on ${surface}: on Your stack the footer adds the releases toggle after the actions, focused or not`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        stackPaneOn(on, {})

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({
          ...PANE,
          surface,
          props: { ...Fixtures.PANE_PROPS, isFocused: false },
        })

        await ui.press({ key: 'tab-@stack' })

        // The filter's label says what reaches it: a click, or Tab walking the controls.
        expect((await ui.find({ key: 'filter' }))?.props.label).toBe('Filter (click or Tab)')
        expect(await footerOf(ui)).toEqual([
          ['ctrl+x tab to use these keys:', 'dim'],
          ...NEWS_KEYS,
          ['releases', 'Releases', 'e'],
        ])

        await ui.press({ key: 'releases' })

        expect((await footerOf(ui))?.at(-1)).toEqual(['releases', 'Hide releases', 'e'])
      },
    )

    test(
      `on ${surface}: giving the pane the keyboard changes the footer alone: tabs, title line, rows and dates are drawn the same, cut to the same width`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const long = Fixtures.datedItemsOf('a', 30).map(item => ({
          ...item,
          title: `${item.title} ${'a headline long enough to be cut at the right end '.repeat(3)}`,
        }))

        Fixtures.bandOn(
          on,
          {
            ...STORE,
            items: { ...STORE.items, a: long },
            saved: long.slice(0, 3).map((item, index) => ({ ...item, savedAt: index + 1 })),
            ...Fixtures.stackStoreOf(Fixtures.STACK_SAMPLE),
          },
          Fixtures.stackTreeOf(Fixtures.STACK_SAMPLE),
        )

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const propsWith = (isFocused: boolean) => ({
          ...Fixtures.PANE_PROPS,
          isFocused,
          bodyColumns: 100,
        })
        const ui = await $.ui.mount({ ...PANE, surface, props: propsWith(false) })

        // The drawn tree without its footer, as plain data; a Button's press handle is new on every draw.
        const aboveFooterOf = async () => {
          const root = (await ui.drawn()) as unknown as { children: unknown[] }

          return JSON.stringify(
            root.children.filter(child => footerKeyOf(child) !== 'footer'),
            (name, value: unknown) => (name === 'press' ? undefined : value),
          )
        }

        // Alpha's tab is active at first, so only the others are pressed.
        for (const tab of [undefined, 'tab-saved', 'tab-@stack']) {
          if (tab !== undefined) {
            await ui.press({ key: tab })

            // The active tab is drawn as a highlighted Box, not a Button.
            expect((await ui.find({ key: tab }))?.type).toBe('Box')
          }

          await ui.redraw(propsWith(false))

          const away = await aboveFooterOf()

          await ui.redraw(propsWith(true))

          expect(await aboveFooterOf()).toBe(away)
          expect(await positionOf(ui)).toMatch(/^1–\d+ of \d+$/)
        }
      },
    )
  }

  test('on mobile, where the Buttons are tapped, the footer has the keys and no focus hint, focused or not', async ($, on) => {
    mock.clock(on)
    Fixtures.bandOn(on, STORE)

    await $.classic.SessionStart({ source: 'clear' })

    const ui = await $.ui.mount({
      ...PANE,
      surface: 'mobile',
      props: { ...Fixtures.PANE_PROPS, isFocused: false },
    })

    expect(await footerOf(ui)).toEqual(NEWS_KEYS)
  })

  const HOUR = 3_600_000

  // The dim Text whose whole text matches, undefined when none is drawn.
  const dimLineOf = async (ui: Drawing, pattern: RegExp) =>
    (await ui.findAll({ type: 'Text' })).find(
      text => text.props.dimColor === true && pattern.test(lineOf(text)),
    )

  for (const surface of SURFACES) {
    test(
      `on ${surface}: a source whose refresh fails keeps its items under a dim line saying why and when it last refreshed, and the window gives that line its row`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on, { now: 2 * HOUR })

        Fixtures.bandOn(on, {
          sources: [ALPHA],
          items: { a: Fixtures.datedItemsOf('a', 30) },
          refreshedAt: { a: 0 },
        })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({
          ...PANE,
          surface,
          props: { ...Fixtures.PANE_PROPS, scroll: { offset: 0, bodyRows: 12 } },
        })

        await ui.press({ key: 'tab-a' })

        const before = (await linksOf(ui)).length

        expect(await dimLineOf(ui, /^Couldn't refresh/)).toBeUndefined()
        expect(await positionOf(ui)).toBe(`1–${before} of 30`)

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        expect(await dimLineOf(ui, /^Couldn't refresh: \S.* · last update 2 h ago$/)).toBeDefined()
        expect((await linksOf(ui)).length).toBe(before - 1)
        expect(await positionOf(ui)).toBe(`1–${before - 1} of 30`)
        expect(await ui.find({ key: 'open' })).toBeDefined()

        // All names the source that failed, above its rows, and gives that line its row too.
        await ui.press({ key: 'tab-@all' })

        expect(await dimLineOf(ui, /^Couldn't refresh Alpha: \S/)).toBeDefined()
        expect((await linksOf(ui)).length).toBe(before - 1)
      },
    )

    test(
      `on ${surface}: an empty source tab tells a source never loaded from one whose feed is empty, and a failure from either`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on, { now: 3 * HOUR })

        Fixtures.bandOn(on, { sources: [ALPHA, BETA], items: {}, refreshedAt: { b: 0 } })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...PANE, surface })

        expect(
          await dimLineOf(
            ui,
            /^No source has items right now\. Herald checks the sources every 5 min\.$/,
          ),
        ).toBeDefined()

        await ui.press({ key: 'tab-a' })

        expect(
          await dimLineOf(ui, /^Nothing from Alpha yet\. Herald checks it every 5 min\.$/),
        ).toBeDefined()

        await ui.press({ key: 'tab-b' })

        expect(
          await dimLineOf(ui, /^Beta has no items right now\. Herald checks it every 5 min\.$/),
        ).toBeDefined()

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        expect(await dimLineOf(ui, /^Couldn't refresh: \S.* · last update 3 h ago$/)).toBeDefined()

        await ui.press({ key: 'tab-a' })

        expect(await dimLineOf(ui, /^Couldn't refresh: [^·]+$/)).toBeDefined()
        expect(await keysOf(ui)).toEqual([
          'tab-@all',
          'tab-b',
          'tab-@stack',
          'tab-saved',
          'up',
          'down',
        ])

        await ui.press({ key: 'tab-@all' })

        expect(await dimLineOf(ui, /^Couldn't refresh 2 sources: Alpha, Beta$/)).toBeDefined()
      },
    )
  }

  const REACT_FEED = 'https://github.com/facebook/react/releases.atom'
  const REACT_TREE = {
    '.git': { isDir: true as const },
    'package.json': JSON.stringify({ name: 'app', dependencies: { react: '19.0.0' } }),
  }

  const STACK_CASES = [
    {
      name: 'no manifest in the project',
      tree: { '.git': { isDir: true } },
      entries: {},
      line: 'No package manifests found in this project.',
    },
    {
      name: 'a package still being looked up',
      tree: REACT_TREE,
      entries: {},
      line: "Checking your stack's releases: 0 of 1 packages so far…",
    },
    {
      name: 'every package read and nothing new',
      tree: REACT_TREE,
      entries: {
        depFeeds: { 'npm:react': { repo: 'facebook/react', feed: REACT_FEED, resolvedAt: 0 } },
        stack: {
          '/repo': {
            deps: { 'npm:react': { checkedAt: 0, current: '19.0.0', seen: [], items: [] } },
            refreshedAt: 0,
          },
        },
      },
      line: 'Everything in your stack is up to date.',
    },
  ] as const

  for (const surface of SURFACES) {
    for (const entry of STACK_CASES) {
      test(
        `on ${surface}: an empty Your stack with ${entry.name} says so`,
        { timeoutMs: 30_000 },
        async ($, on) => {
          // A detection stamped at 0 reads as never run.
          const clock = mock.clock(on, { now: 1000 })

          Fixtures.bandOn(on, { ...STORE, ...entry.entries }, entry.tree)

          await $.session.start(Fixtures.SESSION)
          await clock.settle()

          const ui = await $.ui.mount({ ...PANE, surface })

          await ui.press({ key: 'tab-@stack' })

          expect(await linksOf(ui)).toEqual([])
          expect(
            (await ui.findAll({ type: 'Text' })).some(
              text => text.props.dimColor === true && lineOf(text) === entry.line,
            ),
          ).toBe(true)
          expect(await ui.find({ key: 'open' })).toBeUndefined()
          expect(await ui.find({ key: 'filter' })).toBeUndefined()
        },
      )
    }
  }

  for (const surface of SURFACES) {
    test(
      `on ${surface}: All, on l, leads with the stack's flagged releases then mixes the sources as the band does, each row naming its source; o, s, v and c act on the item under the row, a release as on the stack tab, and a news item read stays listed, dim`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const runs: (readonly string[])[] = []
        const copies: string[] = []
        const { stored, logs } = stackPaneOn(on, {})

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
        // Each row's source column as drawn: its text, and the release color or dim.
        const columnsOf = async () =>
          (await ui.findAll({ type: 'Text' }))
            .filter(
              text =>
                isPart(text) &&
                /^(Alpha|Beta|react|requests|vite|zod)$/.test(lineOf(text)) &&
                text.props.underline !== true,
            )
            .map(text => [
              lineOf(text),
              text.props.color === 'inverseText'
                ? 'selected'
                : text.props.color === 'claude'
                  ? 'release'
                  : text.props.dimColor === true
                    ? 'dim'
                    : 'plain',
            ])

        expect((await tabsOf(ui))[0]).toEqual([
          'tab-@all',
          activeOf(surface, 'l', 'All'),
          undefined,
          'active',
        ])
        expect((await linksOf(ui)).slice(0, 4)).toEqual([
          'https://github.com/owner/react/releases/tag/v19.0.0',
          'https://github.com/owner/requests/releases/tag/v2.31.1',
          'https://example.com/a/1',
          'https://example.com/b/1',
        ])
        expect((await linksOf(ui)).length).toBe(5 + 4)
        expect((await columnsOf()).slice(0, 4)).toEqual([
          ['react', 'selected'],
          ['requests', 'release'],
          ['Alpha', 'dim'],
          ['Beta', 'dim'],
        ])
        expect(await keysOf(ui)).toContain('save')
        expect(await ui.find({ key: 'releases' })).toBeUndefined()
        expect(await ui.find({ key: 'filter' })).toBeUndefined()

        await ui.press({ key: 'copy' })
        await ui.press({ key: 'save' })
        await ui.press({ key: 'open' })

        expect(copies).toEqual([
          "We use react 18.2.0. react 19.0.0 is out: https://github.com/owner/react/releases/tag/v19.0.0\nCheck whether it affects this project and what we'd need to change.",
        ])
        expect((stored.get('saved') as { id: string }[]).map(item => item.id)).toEqual([
          expect.stringContaining('npm:react|'),
        ])
        expect((await ui.find({ key: 'save' }))?.props.label).toBe('Saved')
        expect(runs.at(-1)).toEqual(['open', 'https://github.com/owner/react/releases/tag/v19.0.0'])

        await ui.press({ key: 'down' })
        await ui.press({ key: 'down' })

        expect(await selectedOf(ui)).toBe('https://example.com/a/1')

        await ui.press({ key: 'open' })
        await ui.press({ key: 'down' })
        await ui.press({ key: 'summarize' })

        expect(runs.at(-1)).toEqual(['open', 'https://example.com/a/1'])
        expect(stored.get('read')).toEqual({ a: ['a:1'] })
        expect(await dimLinksOf(ui)).toEqual(['https://example.com/a/1'])
        expect(logs.filter(line => line.startsWith('transcript: '))).toEqual([
          'transcript: b 1',
          'transcript: b 1 one.',
          'transcript: b 1 two.',
          'transcript: b 1 three.',
        ])

        // Back from a source tab, All starts at its top, the read item still listed, dim.
        await ui.press({ key: 'tab-a' })

        expect((await ui.find({ type: 'Button', key: 'tab-@all' }))?.props.hotkey).toBe('l')

        await ui.press({ key: 'tab-@all' })

        expect(await selectedOf(ui)).toBe('https://github.com/owner/react/releases/tag/v19.0.0')
        expect((await linksOf(ui)).length).toBe(9)
        expect(await dimLinksOf(ui)).toEqual(['https://example.com/a/1'])
      },
    )
  }
})
