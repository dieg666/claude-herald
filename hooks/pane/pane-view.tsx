/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code'

import { actionRowView } from '../band/action-row-view.js'
import type { BandUi } from '../band/band-ui.js'
import { iconGapOf } from '../band/icon-gap-of.js'
import { SOURCE_GAP_COLUMNS } from '../band/source-gap-columns.js'
import { SUMMARY_INDENT } from '../band/summary-indent.js'
import { SUMMARY_PLACEHOLDER } from '../band/summary-placeholder.js'
import { PANE_HOTKEYS } from '../names/pane-hotkeys.js'
import { PANE_DATE_COLUMNS } from './pane-date-columns.js'
import type { PaneHandlers } from './pane-handlers.js'
import type { PaneModel } from './pane-model.js'
import type { PaneRow } from './pane-row.js'
import type { PaneUi } from './pane-ui.js'

/**
 * One item on one line: the selection mark, the headline (a release row has its glyph before it), on the saved tab the source name dim, and the date in a column at the right end; the selected item's summary dim beneath, `…` while pending, nothing for an item without one (no text, or replies rejected for now); a stack tab row keeps its columns after the headline, a release under its package indented.
 *
 * @param ui the elements
 * @param row the item as drawn
 */
function rowView(ui: BandUi, row: PaneRow): RenderElement {
  const { Box, Text, Link } = ui

  const head = [
    <Text color={row.isSelected ? 'suggestion' : 'inactive'}>{row.isSelected ? '›' : ' '}</Text>,
    row.isIndented === true ? '   ' : ' ',
    ...(row.icon === undefined
      ? []
      : [<Text color="claude">{row.icon}</Text>, iconGapOf(row.icon)]),
    <Text bold={row.isSelected}>
      {row.href === undefined ? row.title : <Link href={row.href}>{row.title}</Link>}
    </Text>,
  ]

  if (row.cells !== undefined) {
    return (
      <Text wrap="truncate-end">
        {head}
        {row.cells.map(cell =>
          cell.color === undefined ? cell.text : <Text color={cell.color}>{cell.text}</Text>,
        )}
        {row.date === undefined ? [] : [' ', <Text dimColor>{row.date}</Text>]}
      </Text>
    )
  }

  const line = (
    <Box flexDirection="row">
      <Box flexGrow={1} flexShrink={1}>
        <Text wrap="truncate-end">{head}</Text>
      </Box>
      {row.source === undefined
        ? []
        : [
            <Box flexShrink={0} paddingLeft={SOURCE_GAP_COLUMNS}>
              <Text dimColor>{row.source}</Text>
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
              <Text dimColor>{row.date}</Text>
            </Box>,
          ]}
    </Box>
  )

  if (!row.isSelected || row.hasNoSummary === true) {
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
      label="Filter"
      placeholder="package, ecosystem, level or flag"
      value={filter}
      submitLabel="filter"
      onInput={value => handlers.filter(value)}
      onSubmit={value => handlers.filter(value)}
    />,
  ]
}

/**
 * The pane: the tab row (the active tab undimmed), the heading with the selection Buttons, the stack tab's summary line and filter, the window of items (the stack tab's under ecosystem headings) or what an empty tab says, then the selected item's actions, with mark-as-read on the saved tab and the releases toggle on the stack tab.
 *
 * @param ui the elements, `Input` among them where the surface has one
 * @param model what to draw
 * @param handlers what each Button and the filter run
 */
export function paneView(ui: PaneUi, model: PaneModel, handlers: PaneHandlers): RenderElement {
  const { Box, Text, Button } = ui

  const read = model.isSavedTab
    ? [
        <Button
          key="read"
          label="Mark as read"
          hotkey={PANE_HOTKEYS.read}
          plain
          onPress={handlers.read}
        />,
      ]
    : []
  const releases =
    model.isExpanded === undefined
      ? []
      : [
          <Button
            key="releases"
            label={model.isExpanded ? 'Hide releases' : 'Releases'}
            hotkey={PANE_HOTKEYS.releases}
            plain
            onPress={handlers.releases}
          />,
        ]

  const body =
    model.rows.length === 0
      ? [<Text dimColor>{model.empty}</Text>]
      : [
          ...model.rows.flatMap(row => [
            ...(row.heading === undefined
              ? []
              : [
                  <Text color="suggestion" bold>
                    {row.heading}
                  </Text>,
                ]),
            rowView(ui, row),
          ]),
          actionRowView(ui, model.isSelectedSaved, handlers, [...releases, ...read]),
        ]

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
        {model.tabs.map(tab => (
          <Button
            key={`tab-${tab.id}`}
            label={tab.label}
            {...(tab.hotkey === undefined ? {} : { hotkey: tab.hotkey })}
            plain
            dimColor={!tab.isActive}
            onPress={handlers.tab(tab.id)}
          />
        ))}
      </Box>
      <Box flexDirection="row" columnGap={2}>
        <Text color="suggestion" wrap="truncate-end">
          {model.heading}
        </Text>
        <Button key="up" label="↑" hotkey={PANE_HOTKEYS.up} plain dimColor onPress={handlers.up} />
        <Button
          key="down"
          label="↓"
          hotkey={PANE_HOTKEYS.down}
          plain
          dimColor
          onPress={handlers.down}
        />
      </Box>
      {model.summary === undefined ? [] : [<Text dimColor>{model.summary}</Text>]}
      {model.filter === undefined ? [] : filterView(ui, model.filter, handlers)}
      {body}
    </Box>
  )
}
