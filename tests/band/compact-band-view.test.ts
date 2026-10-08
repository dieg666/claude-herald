import type { ElementQuery, FoundElement } from 'claude-code/testing'
import { describe, expect, mock, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('compact-band-view', () => {
  const SURFACES = ['terminal', 'desktop'] as const
  const SOURCE = Fixtures.sourceAt('src', { name: 'Hacker News' })
  const STORE = { sources: [SOURCE], items: { src: Fixtures.datedItemsOf('src', 7) } }
  const BAND = { plugin: 'herald', component: 'AbovePrompt', props: Fixtures.BAND_PROPS } as const

  type Drawing = {
    find: (query: ElementQuery) => Promise<FoundElement | undefined>
    findAll: (query: ElementQuery) => Promise<FoundElement[]>
  }

  const at = (surface: (typeof SURFACES)[number], columns: number) => ({
    ...BAND,
    surface,
    props: { ...Fixtures.BAND_PROPS, bodyColumns: columns },
  })

  const positionOf = async (ui: Drawing) =>
    (await ui.find({ type: 'Text', text: /^\d+\/\d+$/ }))?.text

  const linksOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Link' })).map(link => [link.props.href, link.children.join('')])

  const buttonsOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Button' })).map(
      button => `${button.props.hotkey}: ${button.props.label}`,
    )

  // A node as `Type:key:hotkey:label`, `Text:text[:bold]`, `Link:text` or `Box:[children]`.
  const drawnAs = (node: unknown): string => {
    const { type, props = {}, children } = node as Partial<FoundElement>

    if (type === 'Button') {
      return `Button:${String(props.key)}:${String(props.hotkey)}:${String(props.label)}`
    }

    if (type === 'Box') {
      return `Box:[${(children ?? []).map(drawnAs).join(',')}]`
    }

    const text = (children ?? []).map(child => (typeof child === 'string' ? child : drawnAs(child)))

    return `${String(type)}:${text.join('')}${props.bold === true ? ':bold' : ''}`
  }

  // The text of a drawn child, a string or an element's strings.
  const textOf = (child: unknown): string =>
    typeof child === 'string'
      ? child
      : ((child as Partial<FoundElement>).children ?? []).map(textOf).join('')

  const rootOf = async (ui: Drawing) => (await ui.findAll({ type: 'Box' }))[0]

  for (const surface of SURFACES) {
    test(`on ${surface}: below 65 cells, one line of Herald, n/N, p, n and auto, then the headline linked and bold; no summary, actions or selection, then what the mods below drew`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount(at(surface, 60))
      const root = await rootOf(ui)

      expect(root?.children?.map(drawnAs)).toEqual([
        'Box:[Box:[Text:Herald:bold,Text:1/7],Box:[Button:prev:p:◀,Button:next:n:▶,Button:auto:a:⏸ auto],Text:Text:Link:src 1:bold]',
        'Text:drawn below',
      ])
      expect(await buttonsOf(ui)).toEqual(['p: ◀', 'n: ▶', 'a: ⏸ auto'])
      expect(await linksOf(ui)).toEqual([['https://example.com/src/1', 'src 1']])
      expect(await ui.find({ type: 'Text', text: 'Hacker News' })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()
      expect(Fixtures.rowsOf(root, 60)).toBe(2)

      await ui.unmount()
    })

    test(
      `on ${surface}: where the room holds it, the source name comes dim before the headline, on one row at 64 cells and on the headline's own row at 40; a release's takes the release color`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        mock.clock(on)

        const releases = Fixtures.sourceAt('rel', {
          name: 'Claude Code releases',
          url: 'https://github.com/anthropics/claude-code/releases.atom',
        })

        Fixtures.bandOn(on, {
          sources: [SOURCE, releases],
          items: {
            src: Fixtures.datedItemsOf('src', 6),
            rel: [{ ...Fixtures.datedItemsOf('rel', 1, 6)[0], title: 'v2.1.294' }],
          },
        })

        await $.classic.SessionStart({ source: 'clear' })

        for (const [columns, rows] of [
          [64, 1],
          [40, 2],
        ] as const) {
          const ui = await $.ui.mount(at(surface, columns))
          const root = await rootOf(ui)
          const name = await ui.find({ type: 'Text', text: /^Hacker News$/ })

          expect([columns, name?.props.dimColor, Fixtures.rowsOf(root, columns)]).toEqual([
            columns,
            true,
            rows + 1,
          ])
          expect((await linksOf(ui)).map(([, text]) => text)).toEqual(['src 1'])

          // The release's source comes second, before the rest of the busier one.
          await ui.press({ key: 'next' })

          const release = await ui.find({ type: 'Text', text: /^Claude Code…$/ })

          expect([release?.props.color, (await linksOf(ui)).map(([, text]) => text)]).toEqual([
            'claude',
            ['v2.1.294'],
          ])
          expect(Fixtures.rowsOf(await rootOf(ui), columns)).toBe(rows + 1)

          // Back to the first item for the next width.
          await ui.press({ key: 'prev' })
          await ui.unmount()
        }
      },
    )

    test(
      `on ${surface}: over a skewed store each turn shows another source, at the same positions and total`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const { sources, items, stack } = Fixtures.SKEWED_BAND

        Fixtures.bandOn(
          on,
          { sources, items, ...Fixtures.stackStoreOf(stack, { showLevel: 'all' }) },
          Fixtures.stackTreeOf(stack),
        )

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount(at(surface, 60))
        const turns: unknown[] = []

        for (let turn = 0; turn < 6; turn += 1) {
          const [[href] = []] = await linksOf(ui)

          turns.push([
            await positionOf(ui),
            /^https:\/\/example\.com\/([^/]+)\//.exec(String(href))?.[1] ?? 'stack',
          ])
          await ui.press({ key: 'next' })
        }

        expect(turns).toEqual([
          ['1/27', 'hn'],
          ['2/27', 'sdk'],
          ['3/27', 'stack'],
          ['4/27', 'anthropic'],
          ['5/27', 'willison'],
          ['6/27', 'hn'],
        ])

        await ui.unmount()
      },
    )

    test(`on ${surface}: compact at 64 cells, the full band of three at 65`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const narrow = await $.ui.mount(at(surface, Band.actionsColumnsOf() - 1))

      expect([await positionOf(narrow), (await linksOf(narrow)).length]).toEqual(['1/7', 1])
      await narrow.unmount()

      const wide = await $.ui.mount(at(surface, Band.actionsColumnsOf()))

      expect([await positionOf(wide), (await linksOf(wide)).length]).toEqual([undefined, 3])
      expect(await wide.find({ key: 'open' })).toBeDefined()
      await wide.unmount()
    })

    test(`on ${surface}: one item a page: n moves one and pauses, p wraps to the last, auto resumes and the clock turns one`, async ($, on) => {
      const clock = mock.clock(on)

      Fixtures.bandOn(on, { ...STORE, settings: { rotateSeconds: 20 } })

      await $.session.start(Fixtures.SESSION)
      await clock.settle()

      const ui = await $.ui.mount(at(surface, 60))

      await ui.press({ key: 'next' })

      expect([await positionOf(ui), await buttonsOf(ui)]).toEqual([
        '2/7',
        ['p: ◀', 'n: ▶', 'a: ▶ auto'],
      ])
      expect(await linksOf(ui)).toEqual([['https://example.com/src/2', 'src 2']])

      await ui.press({ key: 'prev' })
      await ui.press({ key: 'prev' })

      expect(await positionOf(ui)).toBe('7/7')

      await ui.press({ key: 'auto' })
      await clock.advance(20_000)

      expect([await positionOf(ui), (await linksOf(ui)).map(([, text]) => text)]).toEqual([
        '1/7',
        ['src 1'],
      ])

      await clock.advance(20_000)

      expect(await positionOf(ui)).toBe('2/7')

      await ui.unmount()
    })

    test(
      `on ${surface}: the compact band takes the same rows on every page at each width, long headline or short`,
      { timeoutMs: 60_000 },
      async ($, on) => {
        mock.clock(on)

        const items = Fixtures.datedItemsOf('src', 12).map((item, index) => ({
          ...item,
          title:
            index % 3 === 0
              ? 'A long headline '.repeat(8)
              : index % 3 === 1
                ? 'x'
                : '漢'.repeat(40),
        }))

        Fixtures.bandOn(on, { sources: [SOURCE], items: { src: items } })

        await $.classic.SessionStart({ source: 'clear' })

        const controls = Band.compactControlsColumnsOf(items.length)
        // One row, the headline's own row, then the name, the Buttons and the headline each on one.
        const expected: Record<number, number> = {
          64: 1,
          [controls + 16]: 1,
          [controls + 15]: 2,
          [controls]: 2,
          [controls - 1]: 3,
          24: 3,
        }

        for (const [width, rows] of Object.entries(expected)) {
          const columns = Number(width)
          const ui = await $.ui.mount(at(surface, columns))
          const seen = new Set<number>()

          for (let turn = 0; turn < items.length; turn++) {
            seen.add(Fixtures.rowsOf(await rootOf(ui), columns))
            await ui.press({ key: 'next' })
          }

          // The band's own rows plus the row of what the mods below drew.
          expect([columns, [...seen]]).toEqual([columns, [rows + 1]])
          await ui.unmount()
        }
      },
    )
  }

  for (const surface of SURFACES) {
    test(
      `on ${surface}: where the room holds the source, the age and the headline's fewest cells (a row of its own, 40 cells) the dim age comes after the source name; narrower or beside the controls, none`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        mock.clock(on, { now: Date.UTC(2026, 0, 2, 5) })
        Fixtures.bandOn(on, STORE)

        await $.classic.SessionStart({ source: 'clear' })

        for (const columns of [64, 40, 33]) {
          const ui = await $.ui.mount(at(surface, columns))
          const age = await ui.find({ type: 'Text', text: /^\d+[mhdwy]$|^now$/ })
          const [line] = (await ui.findAll({ type: 'Text' })).filter(
            text => text.props.wrap === 'truncate-end',
          )

          if (columns === 40) {
            expect([age?.text, age?.props.dimColor]).toEqual(['5h', true])
            expect(
              (line?.children.map(textOf).join('') ?? '').startsWith('Hacker News  5h  src 1'),
            ).toBe(true)
            expect(Fixtures.rowsOf(await rootOf(ui), columns)).toBe(3)
          } else {
            expect(age).toBeUndefined()
          }

          await ui.unmount()
        }
      },
    )
  }
})
