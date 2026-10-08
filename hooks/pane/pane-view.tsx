/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement, RenderSurface } from 'claude-code'

import type { BandUi } from '../band/band-ui.js'
import { iconGapOf } from '../band/icon-gap-of.js'
import { selectedFillOf } from '../band/selected-fill-of.js'
import { selectedStyleOf } from '../band/selected-style-of.js'
import { SOURCE_GAP_COLUMNS } from '../band/source-gap-columns.js'
import { SUMMARY_INDENT } from '../band/summary-indent.js'
import { SUMMARY_PLACEHOLDER } from '../band/summary-placeholder.js'
import { ACTION_HOTKEYS } from '../names/action-hotkeys.js'
import { ACTION_LABELS } from '../names/action-labels.js'
import { PANE_HOTKEYS } from '../names/pane-hotkeys.js'
import { PANE_LABELS } from '../names/pane-labels.js'
import { PANE_DATE_COLUMNS } from './pane-date-columns.js'
import type { PaneHandlers } from './pane-handlers.js'
import type { PaneKey } from './pane-key.js'
import type { PaneModel } from './pane-model.js'
import type { PaneRow } from './pane-row.js'
import { paneTabSpellingOf } from './pane-tab-spelling-of.js'
import { paneTabTextOf } from './pane-tab-text-of.js'
import type { PaneTabView } from './pane-tab-view.js'
import type { PaneUi } from './pane-ui.js'

/**
 * One item on one line: the selection mark, the headline (a release row has its glyph before it; dim once read, unless selected), on the saved tab the source name dim, and the date in a column at the right end; the selected item's summary dim beneath, `…` while pending, nothing for an item without one (no text, or replies rejected for now); a stack tab row keeps its columns after the headline, a release under its package indented.
 *
 * @param ui the elements
 * @param row the item as drawn
 */
function rowView(ui: BandUi, row: PaneRow): RenderElement {
  const { Box, Text, Link } = ui

  const style = selectedStyleOf(row.isSelected)
  const fill = selectedFillOf(row.isSelected)

  const head = [
    <Text color={row.isSelected ? 'suggestion' : 'inactive'} {...style}>
      {row.isSelected ? '›' : ' '}
    </Text>,
    row.isIndented === true ? '   ' : ' ',
    ...(row.icon === undefined
      ? []
      : [
          <Text color="claude" {...style}>
            {row.icon}
          </Text>,
          iconGapOf(row.icon),
        ]),
    <Text
      bold={row.isSelected}
      {...(row.isRead === true && !row.isSelected ? { dimColor: true } : {})}
      {...style}
    >
      {row.href === undefined ? row.title : <Link href={row.href}>{row.title}</Link>}
    </Text>,
  ]

  const line =
    row.cells !== undefined ? (
      <Box flexDirection="row" {...fill}>
        <Box flexGrow={1} flexShrink={1}>
          <Text wrap="truncate-end" {...style}>
            {head}
            {row.cells.map(cell =>
              cell.color === undefined ? (
                cell.text
              ) : (
                <Text color={cell.color} bold={row.isSelected} {...style}>
                  {cell.text}
                </Text>
              ),
            )}
            {row.date === undefined
              ? []
              : [
                  ' ',
                  <Text dimColor={!row.isSelected} {...style}>
                    {row.date}
                  </Text>,
                ]}
          </Text>
        </Box>
      </Box>
    ) : (
      <Box flexDirection="row" {...fill}>
        <Box flexGrow={1} flexShrink={1}>
          <Text wrap="truncate-end" {...style}>
            {head}
          </Text>
        </Box>
        {row.source === undefined
          ? []
          : [
              <Box flexShrink={0} paddingLeft={SOURCE_GAP_COLUMNS}>
                <Text dimColor={!row.isSelected} {...style}>
                  {row.source}
                </Text>
              </Box>,
            ]}
        {row.date === undefined
          ? []
          : [
              <Box
                flexShrink={0}
                width={PANE_DATE_COLUMNS + 1}
                paddingLeft={1}
                justifyContent="flex-end"
              >
                <Text dimColor={!row.isSelected} {...style}>
                  {row.date}
                </Text>
              </Box>,
            ]}
      </Box>
    )

  if (row.cells !== undefined || !row.isSelected || row.hasNoSummary === true) {
    return line
  }

  return (
    <Box flexDirection="column">
      {line}
      <Box flexDirection="column" paddingLeft={SUMMARY_INDENT}>
        {(row.summaryLines ?? [SUMMARY_PLACEHOLDER]).map(text => (
          <Text dimColor wrap="truncate-end">
            {text}
          </Text>
        ))}
      </Box>
    </Box>
  )
}

/**
 * One tab of the tab row: the active one as plain text filled like the selected row, bold and underlined too, spelled on the terminal as a plain Button there reads so the row keeps its layout, and as its text alone elsewhere, as a native button reads; any other a dim Button with its hotkey.
 *
 * @param ui the elements
 * @param tab the tab
 * @param handlers what pressing it runs
 * @param surface where the pane is drawn
 */
function tabView(
  ui: PaneUi,
  tab: PaneTabView,
  handlers: PaneHandlers,
  surface: RenderSurface,
): RenderElement {
  const { Box, Text, Button } = ui

  if (tab.isActive) {
    return (
      <Box key={`tab-${tab.id}`} flexShrink={0} {...selectedFillOf(true)}>
        <Text bold underline {...selectedStyleOf(true)}>
          {surface === 'terminal' ? paneTabSpellingOf(tab) : paneTabTextOf(tab)}
        </Text>
      </Box>
    )
  }

  return (
    <Button
      key={`tab-${tab.id}`}
      label={paneTabTextOf(tab)}
      {...(tab.hotkey === undefined ? {} : { hotkey: tab.hotkey })}
      plain
      dimColor
      onPress={handlers.tab(tab.id)}
    />
  )
}

/**
 * The stack tab's filter: a text field where the surface has one, else the filter in force as dim text (nothing when there is none).
 *
 * @param ui the elements
 * @param filter the filter in force
 * @param handlers what typing runs
 */
function filterView(ui: PaneUi, filter: string, handlers: PaneHandlers): RenderElement[] {
  const { Input, Text } = ui

  if (Input === undefined) {
    return filter === '' ? [] : [<Text dimColor>{`Filter: ${filter}`}</Text>]
  }

  return [
    <Input
      key="filter"
      label="Filter (click or Tab)"
      placeholder="package, ecosystem, level or flag"
      value={filter}
      submitLabel="filter"
      onInput={value => handlers.filter(value)}
      onSubmit={value => handlers.filter(value)}
    />,
  ]
}

/**
 * One footer key as a plain Button: Save reads Saved, dim, once the selected item is saved; the releases toggle reads Hide releases while the selected package's releases are listed.
 *
 * @param ui the elements
 * @param key which key
 * @param model what the pane draws
 * @param handlers what pressing it runs
 */
function keyView(
  ui: PaneUi,
  key: PaneKey,
  model: PaneModel,
  handlers: PaneHandlers,
): RenderElement {
  const { Button } = ui

  switch (key) {
    case 'save':
      return (
        <Button
          key="save"
          label={model.isSelectedSaved ? ACTION_LABELS.saved : ACTION_LABELS.save}
          hotkey={ACTION_HOTKEYS.save}
          plain
          dimColor={model.isSelectedSaved}
          onPress={handlers.save}
        />
      )
    case 'read':
      return (
        <Button
          key="read"
          label={PANE_LABELS.read}
          hotkey={PANE_HOTKEYS.read}
          plain
          onPress={handlers.read}
        />
      )
    case 'releases':
      return (
        <Button
          key="releases"
          label={model.isExpanded === true ? PANE_LABELS.hideReleases : PANE_LABELS.releases}
          hotkey={PANE_HOTKEYS.releases}
          plain
          onPress={handlers.releases}
        />
      )
    default:
      return (
        <Button
          key={key}
          label={ACTION_LABELS[key]}
          hotkey={ACTION_HOTKEYS[key]}
          plain
          onPress={handlers[key]}
        />
      )
  }
}

/**
 * The footer: the focus hint dim while the pane does not hold the keyboard, then the keys that act on the active tab; nothing on an empty tab.
 *
 * @param ui the elements
 * @param model what the pane draws
 * @param handlers what each Button runs
 */
function footerView(ui: PaneUi, model: PaneModel, handlers: PaneHandlers): RenderElement[] {
  const { Box, Text } = ui

  if (model.keys.length === 0) {
    return []
  }

  return [
    <Box key="footer" flexDirection="row" flexWrap="wrap" columnGap={2} flexShrink={0}>
      {model.hint === undefined ? [] : [<Text dimColor>{model.hint}</Text>]}
      {model.keys.map(key => keyView(ui, key, model, handlers))}
    </Box>,
  ]
}

/**
 * The pane: the tab row (the active tab highlighted), the title line with the selection Buttons and the window's position at its right end, the stack tab's summary line and filter, the window of items (the stack tab's under ecosystem headings) or what an empty tab says in a Box that takes the free rows, then the footer, at the pane's bottom when the tree fills it.
 *
 * @param ui the elements, `Input` among them where the surface has one
 * @param model what to draw
 * @param handlers what each Button and the filter run
 * @param surface where the pane is drawn
 * @param fillRows the rows the tree takes at least, so the footer sits at the pane's bottom; none to fit the content
 */
export function paneView(
  ui: PaneUi,
  model: PaneModel,
  handlers: PaneHandlers,
  surface: RenderSurface,
  fillRows?: number,
): RenderElement {
  const { Box, Text, Button } = ui

  const body =
    model.rows.length === 0
      ? [<Text dimColor>{model.empty}</Text>]
      : model.rows.flatMap(row => [
          ...(row.heading === undefined
            ? []
            : [
                <Text color="suggestion" bold>
                  {row.heading}
                </Text>,
              ]),
          rowView(ui, row),
        ])

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      {...(fillRows === undefined ? {} : { minHeight: fillRows })}
    >
      <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
        {model.tabs.map(tab => tabView(ui, tab, handlers, surface))}
      </Box>
      <Box flexDirection="row" columnGap={2}>
        <Button key="up" label="↑" hotkey={PANE_HOTKEYS.up} plain dimColor onPress={handlers.up} />
        <Button
          key="down"
          label="↓"
          hotkey={PANE_HOTKEYS.down}
          plain
          dimColor
          onPress={handlers.down}
        />
        {model.position === undefined
          ? []
          : [
              <Box flexGrow={1} justifyContent="flex-end">
                <Text color="suggestion" wrap="truncate-end">
                  {model.position}
                </Text>
              </Box>,
            ]}
      </Box>
      {model.summary === undefined ? [] : [<Text dimColor>{model.summary}</Text>]}
      {model.filter === undefined ? [] : filterView(ui, model.filter, handlers)}
      <Box key="rows" flexDirection="column" flexGrow={1}>
        {body}
      </Box>
      {footerView(ui, model, handlers)}
    </Box>
  )
}
