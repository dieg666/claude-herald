import type { ElementQuery, FoundElement } from 'claude-code/testing'
import { describe, expect, mock, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'
import Band from '../../hooks/band'
import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'

describe('band-view', () => {
  const SURFACES = ['terminal', 'desktop'] as const
  const SOURCE = Fixtures.sourceAt('src', { name: 'Hacker News' })
  const STORE = { sources: [SOURCE], items: { src: Fixtures.datedItemsOf('src', 7) } }
  const BAND = { plugin: 'herald', component: 'AbovePrompt', props: Fixtures.BAND_PROPS } as const

  type Drawing = {
    find: (query: ElementQuery) => Promise<FoundElement | undefined>
    findAll: (query: ElementQuery) => Promise<FoundElement[]>
  }

  const rangeOf = async (ui: Drawing) => (await ui.find({ type: 'Text', text: / of \d+$/ }))?.text

  const autoOf = async (ui: Drawing) => (await ui.find({ key: 'auto' }))?.props.label

  // The band's own Box and its header and actions line, the last child being what the mods below drew.
  const partsOf = async (ui: Drawing) => {
    const [root] = await ui.findAll({ type: 'Box' })
    const kids = (root?.children ?? []) as FoundElement[]

    return { root, header: kids[0], actions: kids[kids.length - 2] }
  }

  // A node as `Type:key:hotkey:label`, or `Text:text[:bold]`, or `Box:[children]`.
  const drawnAs = (node: unknown): string => {
    const { type, props = {}, children } = node as Partial<FoundElement>

    if (type === 'Button') {
      return `Button:${String(props.key)}:${String(props.hotkey)}:${String(props.label)}`
    }

    return type === 'Box'
      ? `Box:[${(children ?? []).map(drawnAs).join(',')}]`
      : `Text:${(children ?? []).join('')}${props.bold === true ? ':bold' : ''}`
  }

  // The headline of the selected row: the bold Text, holding a Link or the plain title.
  const selectedOf = async (ui: Drawing) => {
    const [bold] = (await ui.findAll({ type: 'Text' })).filter(
      text => text.props.bold === true && text.text !== 'Herald',
    )
    const [child] = bold?.children ?? []

    return typeof child === 'string' ? child : (child as FoundElement | undefined)?.props.href
  }

  const linksOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Link' })).map(link => [link.props.href, link.children.join('')])

  // The text of a drawn child, a string or an element's strings.
  const textOf = (child: unknown): string =>
    typeof child === 'string'
      ? child
      : ((child as Partial<FoundElement>).children ?? []).map(textOf).join('')

  // Each item's headline line, as its children: the Text that holds the mark first.
  const headlineLinesOf = async (ui: Drawing) =>
    (await ui.findAll({ type: 'Text' })).filter(
      text =>
        text.props.wrap === 'truncate-end' &&
        (text.children as Partial<FoundElement>[]).some(child => child.props?.bold !== undefined),
    )

  const headlineIndexOf = (line: FoundElement) =>
    (line.children as Partial<FoundElement>[]).findIndex(child => child.props?.bold !== undefined)

  // The cells before each headline: the mark, a space, the glyph and its gap, the label and its gap.
  const leadsOf = async (ui: Drawing) =>
    (await headlineLinesOf(ui)).map(line =>
      Band.displayWidthOf(line.children.slice(0, headlineIndexOf(line)).map(textOf).join('')),
    )

  // How many children follow each headline on its line.
  const trailsOf = async (ui: Drawing) =>
    (await headlineLinesOf(ui)).map(line => line.children.length - headlineIndexOf(line) - 1)

  // A drawn tree without its press handles, which differ from one drawing to the next.
  const shapeOf = (tree: unknown) =>
    JSON.parse(JSON.stringify(tree, (key, value: unknown) => (key === 'press' ? undefined : value)))

  // The band cannot tell whether it has the keyboard, so its selected row stays bold with the mark and is never filled.
  for (const surface of SURFACES) {
    test(`on ${surface}: the selected row is marked and bold, with no fill or inverse color`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...BAND, surface })

      expect((await ui.findAll({ type: 'Text', text: /^›$/ })).length).toBe(1)
      expect(
        (await ui.findAll({ type: 'Text' })).filter(
          text => text.props.bold === true && text.text !== 'Herald',
        ),
      ).toHaveLength(1)
      expect(
        Fixtures.colorsOf(await ui.drawn()).filter(color =>
          ['text', 'inverseText'].includes(color),
        ),
      ).toEqual([])
      expect(
        (await ui.findAll({ type: 'Box' })).filter(box => box.props.backgroundColor !== undefined),
      ).toEqual([])
    })
  }

  for (const surface of SURFACES) {
    test(
      `on ${surface}: header, three linked items with summaries or a placeholder, actions, then what the mods below drew`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        mock.clock(on)
        Fixtures.bandOn(on, {
          settings: Fixtures.SUMMARIES_ON,
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

        expect(await rangeOf(ui)).toBe('1–3 of 7')
        expect(await autoOf(ui)).toBe('⏸ auto')
        expect(await linksOf(ui)).toEqual([
          ['https://example.com/src/1', 'src 1'],
          ['https://example.com/src/2', 'src 2'],
          ['https://example.com/src/3', 'src 3'],
        ])
        expect(await ui.find({ type: 'Text', text: 'First, in short.' })).toBeDefined()
        expect((await ui.findAll({ type: 'Text', text: /^…$/ })).length).toBe(2)
        // The source name, dim, in the column before each headline; no glyph.
        expect(
          (await ui.findAll({ type: 'Text', text: /^Hacker News$/ })).map(
            name => name.props.dimColor,
          ),
        ).toEqual([true, true, true])
        expect(
          (await ui.findAll({ type: 'Text' })).filter(text => text.props.color === 'claude'),
        ).toEqual([])
        expect((await ui.findAll({ type: 'Text', text: /^›$/ })).length).toBe(1)
        expect(await selectedOf(ui)).toBe('https://example.com/src/1')
        expect(
          (await ui.findAll({ type: 'Button' })).map(button => [button.key, button.props.label]),
        ).toEqual([
          ['prev', '◀'],
          ['next', '▶'],
          ['auto', '⏸ auto'],
          ['open', 'Open'],
          ['summarize', 'Summarize'],
          ['save', 'Save'],
          ['copy', 'Copy for Claude'],
          ['up', '↑'],
          ['down', '↓'],
        ])
        expect(await ui.find({ type: 'Text', text: 'drawn below' })).toBeDefined()

        await ui.unmount()
      },
    )

    test(`on ${surface}: the header reads Herald in bold, the position, then only back, next and auto; up and down follow the actions`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...BAND, surface })
      const { header, actions } = await partsOf(ui)

      expect(header?.children?.map(drawnAs)).toEqual([
        'Text:Herald:bold',
        'Text:1–3 of 7',
        'Box:[Button:prev:p:◀,Button:next:n:▶,Button:auto:a:⏸ auto]',
      ])
      expect(actions?.children?.map(drawnAs)).toEqual([
        'Button:open:o:Open',
        'Button:summarize:s:Summarize',
        'Button:save:v:Save',
        'Button:copy:c:Copy for Claude',
        'Box:[Button:up:k:↑,Button:down:j:↓]',
      ])
      // The group of up and down is set apart from the actions by a margin.
      expect(actions?.children?.map(child => (child as FoundElement).props?.marginLeft)).toEqual([
        undefined,
        undefined,
        undefined,
        undefined,
        2,
      ])

      await ui.unmount()
    })

    test(`on ${surface}: the header and the actions take as many rows as before at 174, 120, 80 and 65 columns`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, { ...STORE, items: { src: Fixtures.datedItemsOf('src', 30) } })

      await $.classic.SessionStart({ source: 'clear' })

      for (const columns of [174, 120, 80, 65]) {
        const ui = await $.ui.mount({
          ...BAND,
          surface,
          props: { ...Fixtures.BAND_PROPS, bodyColumns: columns },
        })
        const { header, actions } = await partsOf(ui)

        // The header and the actions as drawn before: the hotkey and label of each Button, the same position text between.
        const before = [
          ['p: ◀', '1–3 of 30', 'n: ▶', 'a: ⏸ auto', 'k: ↑', 'j: ↓'],
          ['o: Open', 's: Summarize', 'v: Save', 'c: Copy for Claude'],
        ].map(line => Fixtures.wrappedRowsOf(line.map(Band.displayWidthOf), columns))

        expect(await rangeOf(ui)).toBe('1–3 of 30')
        expect([Fixtures.rowsOf(header, columns), Fixtures.rowsOf(actions, columns)]).toEqual(
          before,
        )

        await ui.unmount()
      }
    })

    test(
      `on ${surface}: the full band's rows are the same at every width it is drawn at, saved selection or not, whatever the position text`,
      { timeoutMs: 60_000 },
      async ($, on) => {
        mock.clock(on)

        const ids = ['a', 'b', 'c', 'd', 'e', 'f']

        Fixtures.bandOn(on, {
          settings: Fixtures.SUMMARIES_ON,
          sources: ids.map(id => Fixtures.sourceAt(id, { name: id })),
          items: Object.fromEntries(ids.map(id => [id, Fixtures.datedItemsOf(id, 28)])),
        })

        await $.classic.SessionStart({ source: 'clear' })

        const actionsWide = Band.actionsColumnsOf()
        const widths = [actionsWide, actionsWide + 1, 80, 120]
        const at = (columns: number) => ({
          ...BAND,
          surface,
          props: { ...Fixtures.BAND_PROPS, bodyColumns: columns },
        })

        // Rows of each width with the first item unsaved, then saved.
        const rowsAt = async () => {
          const rows: Record<string, number[]> = {}

          for (const columns of widths) {
            const ui = await $.ui.mount(at(columns))
            const unsaved = Fixtures.rowsOf((await partsOf(ui)).root, columns)

            await ui.press({ key: 'save' })

            const saved = Fixtures.rowsOf((await partsOf(ui)).root, columns)

            expect(await ui.find({ key: 'save' })).toMatchObject({ props: { label: 'Saved' } })
            await ui.press({ key: 'save' })
            await ui.unmount()
            rows[columns] = [unsaved, saved]
          }

          return rows
        }

        const first = await rowsAt()
        const ui = await $.ui.mount(at(80))

        for (let turn = 0; turn < 33; turn++) {
          await ui.press({ key: 'next' })
        }

        expect(await rangeOf(ui)).toBe('100–102 of 168')
        await ui.unmount()

        const later = await rowsAt()

        for (const columns of widths) {
          // The header and the actions, one row each, plus three items of two rows and what is below.
          const expected = 1 + 6 + 1 + 1

          expect([columns, first[columns], later[columns]]).toEqual([
            columns,
            [expected, expected],
            [expected, expected],
          ])
        }
      },
    )

    test(`on ${surface}: a bare version tag is drawn bare after its source's name, never repeating it, the stored title unchanged`, async ($, on) => {
      mock.clock(on)

      const source = Fixtures.sourceAt('rel', { name: 'Claude Code' })
      const tag = { ...Fixtures.datedItemsOf('rel', 2)[0], title: 'v2.1.293' }
      const headline = { ...Fixtures.datedItemsOf('rel', 2)[1], title: 'Claude Code v2.1.292 adds' }
      const { stored } = Fixtures.bandOn(on, { sources: [source], items: { rel: [tag, headline] } })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...BAND, surface })

      expect((await linksOf(ui)).map(([, text]) => text)).toEqual([
        'v2.1.293',
        'Claude Code v2.1.292 adds',
      ])
      // One name a row, in the column; the bare tag is a release, the headline of a news feed is not.
      expect(
        (await ui.findAll({ type: 'Text', text: /^Claude Code$/ })).map(name => [
          name.props.color,
          name.props.dimColor,
        ]),
      ).toEqual([
        ['claude', undefined],
        [undefined, true],
      ])
      expect(stored.get('items')).toEqual({ rel: [tag, headline] })

      await ui.unmount()
    })

    test(`on ${surface}: a release feed's names take the release color, a news feed's stay dim`, async ($, on) => {
      mock.clock(on)

      const releases = Fixtures.sourceAt('rel', {
        name: 'Claude Code releases',
        url: 'https://github.com/anthropics/claude-code/releases.atom',
      })
      const news = Fixtures.sourceAt('hn', { name: 'HN' })

      Fixtures.bandOn(on, {
        sources: [releases, news],
        items: {
          rel: [{ ...Fixtures.datedItemsOf('rel', 1)[0], title: 'Claude Code 2.1.294 is out' }],
          hn: Fixtures.datedItemsOf('hn', 1, 1),
        },
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...BAND, surface })
      const labelOf = async (text: RegExp) => {
        const found = await ui.find({ type: 'Text', text })

        return [found?.props.color, found?.props.dimColor]
      }

      expect(await labelOf(/^Claude Code…$/)).toEqual(['claude', undefined])
      expect(await labelOf(/^HN$/)).toEqual([undefined, true])

      await ui.unmount()
    })

    test(
      `on ${surface}: at 174, 120 and 80 columns every headline and summary starts at cell 16, after the twelve-cell column and its gap, and nothing follows the headline`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        mock.clock(on)

        const sources = [
          Fixtures.sourceAt('hn', { name: 'HN' }),
          Fixtures.sourceAt('sw', { name: 'Simon Willison' }),
          Fixtures.sourceAt('src', { name: 'Hacker News' }),
        ]

        Fixtures.bandOn(on, {
          settings: Fixtures.SUMMARIES_ON,
          sources,
          items: {
            hn: Fixtures.datedItemsOf('hn', 1),
            sw: Fixtures.datedItemsOf('sw', 1, 1),
            src: Fixtures.datedItemsOf('src', 1, 2),
          },
        })

        await $.classic.SessionStart({ source: 'clear' })

        for (const columns of [174, 120, 80]) {
          const ui = await $.ui.mount({
            ...BAND,
            surface,
            props: { ...Fixtures.BAND_PROPS, bodyColumns: columns },
          })

          expect(await leadsOf(ui)).toEqual([16, 16, 16])
          expect(await trailsOf(ui)).toEqual([0, 0, 0])
          expect(
            (await ui.findAll({ type: 'Box' }))
              .map(box => box.props.paddingLeft)
              .filter(padding => padding !== undefined),
          ).toEqual([16, 16, 16])
          expect(await ui.find({ type: 'Text', text: /^Simon Willi…$/ })).toBeDefined()

          await ui.unmount()
        }
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

    test(`on ${surface}: read items leave the band while unread ones remain, its count and pages over the rest; once all are read, all come back`, async ($, on) => {
      mock.clock(on)

      const { stored } = Fixtures.bandOn(on, { ...STORE, read: { src: ['src:1', 'src:3'] } })

      on('ui.copy', () => ({ value: { isCopied: true } }))

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...BAND, surface })
      const hrefsOf = async () => (await linksOf(ui)).map(([href]) => href)

      expect(await rangeOf(ui)).toBe('1–3 of 5')
      expect(await hrefsOf()).toEqual([2, 4, 5].map(n => `https://example.com/src/${n}`))

      await ui.press({ key: 'copy' })

      expect(stored.get('read')).toEqual({ src: ['src:2', 'src:1', 'src:3'] })
      expect(await rangeOf(ui)).toBe('1–3 of 4')
      expect(await hrefsOf()).toEqual([4, 5, 6].map(n => `https://example.com/src/${n}`))

      await ui.press({ key: 'next' })

      expect(await rangeOf(ui)).toBe('4 of 4')
      expect(await hrefsOf()).toEqual(['https://example.com/src/7'])

      await ui.press({ key: 'copy' })
      await ui.press({ key: 'prev' })
      await ui.press({ key: 'copy' })
      await ui.press({ key: 'down' })
      await ui.press({ key: 'copy' })
      await ui.press({ key: 'copy' })

      expect((stored.get('read') as Record<string, string[]>).src?.length).toBe(7)
      expect(await rangeOf(ui)).toMatch(/ of 7$/)
    })

    test(`on ${surface}: next shows the next page and pauses, prev pauses, auto resumes; pages wrap both ways`, async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, STORE)

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...BAND, surface })

      await ui.press({ key: 'next' })

      expect([await rangeOf(ui), await autoOf(ui)]).toEqual(['4–6 of 7', '▶ auto'])

      await ui.press({ key: 'next' })

      expect(await rangeOf(ui)).toBe('7 of 7')
      expect(await linksOf(ui)).toEqual([['https://example.com/src/7', 'src 7']])

      await ui.press({ key: 'next' })

      expect(await rangeOf(ui)).toBe('1–3 of 7')

      await ui.press({ key: 'prev' })

      expect(await rangeOf(ui)).toBe('7 of 7')

      await ui.press({ key: 'auto' })

      expect(await autoOf(ui)).toBe('⏸ auto')

      await ui.press({ key: 'prev' })

      expect([await rangeOf(ui), await autoOf(ui)]).toEqual(['4–6 of 7', '▶ auto'])

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

        expect(await rangeOf(ui)).toBe('1–3 of 7')

        await clock.advance(1)

        expect(await rangeOf(ui)).toBe('4–6 of 7')

        await clock.advance(20_000)

        expect(await rangeOf(ui)).toBe('7 of 7')

        await clock.advance(20_000)

        expect(await rangeOf(ui)).toBe('1–3 of 7')

        await ui.press({ key: 'auto' })
        await clock.advance(60_000)

        expect([await rangeOf(ui), await autoOf(ui)]).toEqual(['1–3 of 7', '▶ auto'])

        await ui.press({ key: 'auto' })
        await clock.advance(20_000)

        expect(await rangeOf(ui)).toBe('4–6 of 7')
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
        '1–3 of 3',
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
        const { asked } = Fixtures.bandOn(on, { ...STORE, settings: Fixtures.SUMMARIES_ON })

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
        settings: Fixtures.SUMMARIES_ON,
        sources: [SOURCE],
        items: {
          src: Fixtures.datedItemsOf('src', 2).map((item, index) => ({
            ...item,
            title: index === 0 ? 'a'.repeat(100) : '漢'.repeat(60),
          })),
        },
        summaries: [
          {
            itemId: 'src:1',
            lang: 'feed',
            kind: 'short',
            version: Summaries.SUMMARY_PROMPT_VERSION,
            text: 'b'.repeat(100),
          },
        ],
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({
        ...BAND,
        surface,
        props: { ...Fixtures.BAND_PROPS, bodyColumns: 70 },
      })

      // Seventy cells less the sixteen before the headline leave fifty-four, for the headline and the summary alike.
      expect((await linksOf(ui)).map(([, text]) => text)).toEqual([
        `${'a'.repeat(53)}…`,
        `${'漢'.repeat(26)}…`,
      ])
      expect(await ui.find({ type: 'Text', text: `${'b'.repeat(53)}…` })).toBeDefined()
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

    test(`on ${surface}: items from every enabled source, one source after another, newest first; when they shrink the page and selection come back inside`, async ($, on) => {
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

      expect((await linksOf(ui)).map(([, text]) => text)).toEqual(['new 1', 'old 1', 'new 2'])

      await ui.press({ key: 'next' })
      await ui.press({ key: 'next' })

      expect(await rangeOf(ui)).toBe('7 of 7')

      await $.command.run(Fixtures.heraldOf('disable old'))

      expect(await rangeOf(ui)).toBe('1–2 of 2')

      await $.command.run(Fixtures.heraldOf('enable old'))

      expect(await rangeOf(ui)).toBe('7 of 7')

      await ui.press({ key: 'next' })
      await ui.press({ key: 'up' })
      await ui.press({ key: 'up' })

      expect(await selectedOf(ui)).toBe('https://example.com/old/1')

      await $.command.run(Fixtures.heraldOf('disable old'))

      expect([await rangeOf(ui), await selectedOf(ui)]).toEqual([
        '1–2 of 2',
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

  for (const surface of SURFACES) {
    test(
      `on ${surface}: with automatic summaries off every row is one line, with no summary or placeholder even when one is cached; the height holds across pages and selection, nothing is asked, and Summarize still asks`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        // Six items, so every page is full.
        const items = Fixtures.datedItemsOf('src', 6).map(item =>
          item.id === 'src:2' ? { ...item, text: '' } : item,
        )
        const { asked, logs } = Fixtures.bandOn(on, {
          sources: [SOURCE],
          items: { src: items },
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
        const heights: number[] = []
        const look = async () => {
          expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()
          expect(await ui.find({ type: 'Text', text: 'First, in short.' })).toBeUndefined()
          expect(
            (await ui.findAll({ type: 'Box' })).filter(
              box => box.props.height === 1 || box.props.paddingLeft !== undefined,
            ),
          ).toEqual([])
          expect((await linksOf(ui)).length).toBe(3)
          heights.push(Fixtures.rowsOf((await partsOf(ui)).root, Fixtures.BAND_PROPS.bodyColumns))
        }

        await look()
        await ui.press({ key: 'down' })
        await look()
        await ui.press({ key: 'next' })
        await clock.settle()
        await look()
        await ui.press({ key: 'next' })
        await clock.settle()
        await look()
        await ui.press({ key: 'auto' })
        await clock.advance(3 * 20_000)
        await clock.settle()
        await look()

        // The header, three one-line items, the actions, then what the mods below drew.
        expect(heights).toEqual(heights.map(() => 1 + 3 + 1 + 1))
        expect(asked).toEqual([])

        await ui.press({ key: 'prev' })
        await ui.press({ key: 'summarize' })
        await clock.settle()

        const selected = String(await selectedOf(ui)).replace('https://example.com/src/', 'src ')

        expect(asked).toEqual([selected])
        expect(logs.filter(line => line.startsWith('transcript: '))).toEqual([
          `transcript: ${selected}`,
          `transcript: ${selected} one.`,
          `transcript: ${selected} two.`,
          `transcript: ${selected} three.`,
        ])
        expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()
      },
    )

    test(
      `on ${surface}: with automatic summaries off a stack row draws its ecosystem, level and flags dim after its headline on its one line`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        stackBandOn(on, { showLevel: 'all' })

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...BAND, surface })
        const [react] = await headlineLinesOf(ui)
        const note = react?.children.at(-1) as FoundElement | undefined

        expect(note?.props.dimColor).toBe(true)
        expect(textOf(note)).toBe('npm · major · breaking')
        expect(Fixtures.rowsOf((await partsOf(ui)).root, Fixtures.BAND_PROPS.bodyColumns)).toBe(6)
        expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()
      },
    )
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
      `on ${surface}: a stack row shows ⚠ or 📦 and its package, links "current → new" to the release and shows its level beneath`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        stackBandOn(on, { showLevel: 'all' })

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...BAND, surface })

        expect(await linksOf(ui)).toEqual([
          ['https://github.com/owner/react/releases/tag/v19.0.0', '18.2.0 → 19.0.0 · React 19'],
          ['https://github.com/owner/vite/releases/tag/v5.1.0', '5.0.0 → 5.1.0'],
          ['https://github.com/owner/lodash/releases/tag/v4.17.21', '4.17.20 → 4.17.21'],
        ])
        expect(
          (await ui.findAll({ type: 'Text', text: /^(⚠|📦|react|vite|lodash)$/ })).map(
            text => text.text,
          ),
        ).toEqual(['⚠', 'react', '📦', 'vite', '📦', 'lodash'])
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

        expect(await rangeOf(ui)).toBe('1–2 of 2')
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

        expect(await rangeOf(ui)).toBe('1–3 of 8')
      },
    )
  }

  for (const surface of SURFACES) {
    test(
      `on ${surface}: ⚠ and 📦 rows show their package in the source column, and start their headlines in the news rows' column`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)
        const news = { sources: [SOURCE], items: { src: Fixtures.datedItemsOf('src', 3) } }

        stackBandOn(on, { showLevel: 'all' }, news)

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...BAND, surface })
        const leads: number[] = []
        const names: unknown[][] = []

        for (let page = 0; page < 3; page += 1) {
          leads.push(...(await leadsOf(ui)))
          names.push(
            ...(
              await ui.findAll({ type: 'Text', text: /^(react|vite|lodash|requests|next|zod)$/ })
            ).map(name => [name.text, name.props.color]),
          )
          await ui.press({ key: 'next' })
        }

        expect(leads).toEqual(Array.from({ length: 9 }, () => 16))
        expect(names).toEqual(
          ['react', 'vite', 'lodash', 'requests', 'next', 'zod'].map(name => [name, 'claude']),
        )
      },
    )
  }

  // The source of a drawn link: a news item's from its address, a release's `stack`.
  const linkSourceOf = (href: unknown) =>
    /^https:\/\/example\.com\/([^/]+)\//.exec(String(href))?.[1] ??
    (String(href).startsWith('https://github.com/owner/') ? 'stack' : String(href))

  const skewedBandOn = (on: Parameters<typeof Fixtures.bandOn>[0]) => {
    const { sources, items, stack } = Fixtures.SKEWED_BAND

    return Fixtures.bandOn(
      on,
      { sources, items, ...Fixtures.stackStoreOf(stack, { showLevel: 'all' }) },
      Fixtures.stackTreeOf(stack),
    )
  }

  for (const surface of SURFACES) {
    test(
      `on ${surface}: a skewed store's pages each show different sources, at the same positions and total`,
      { timeoutMs: 20_000 },
      async ($, on) => {
        const clock = mock.clock(on)

        skewedBandOn(on)

        await $.session.start(Fixtures.SESSION)
        await clock.settle()

        const ui = await $.ui.mount({ ...BAND, surface })
        const pages: unknown[] = []

        for (let page = 0; page < 9; page += 1) {
          pages.push([await rangeOf(ui), (await linksOf(ui)).map(([href]) => linkSourceOf(href))])
          await ui.press({ key: 'next' })
        }

        expect(pages.slice(0, 4)).toEqual([
          ['1–3 of 27', ['hn', 'sdk', 'stack']],
          ['4–6 of 27', ['anthropic', 'willison', 'hn']],
          ['7–9 of 27', ['sdk', 'anthropic', 'stack']],
          ['10–12 of 27', ['hn', 'hn', 'hn']],
        ])
        expect(pages.map(page => (page as unknown[])[0])).toEqual(
          Array.from({ length: 9 }, (_, page) => `${page * 3 + 1}–${page * 3 + 3} of 27`),
        )
      },
    )
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
          settings: Fixtures.SUMMARIES_ON,
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
          sources: [Fixtures.sourceAt(id)],
          items: { [id]: Fixtures.datedItemsOf(id, 7) },
          settings: { ...Fixtures.SUMMARIES_ON, rotateSeconds: 3600 },
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
