import type { StackItem } from '../../types/index.js'
import { displayWidthOf } from '../band/display-width-of.js'
import { fitColumns } from '../band/fit-columns.js'
import { ICON_COLUMNS } from '../band/icon-columns.js'
import { httpUrlOf } from '../commands/http-url-of.js'
import { ECOSYSTEM_LABELS } from '../deps/stack/ecosystem-labels.js'
import { levelColorOf } from '../deps/stack/level-color-of.js'
import { packageFlagsOf } from '../deps/stack/package-flags-of.js'
import { stackIconOf } from '../deps/stack/stack-icon-of.js'
import type { StackPackage } from '../deps/stack/stack-package.js'
import { stackPackageNoteOf } from '../deps/stack/stack-package-note-of.js'
import type { StackRow } from '../deps/stack/stack-row.js'
import { stackVersionOf } from '../deps/stack/stack-version-of.js'
import { versionChangeOf } from '../deps/stack/version-change-of.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import type { PaneCell } from './pane-cell.js'
import { PANE_DATE_COLUMNS } from './pane-date-columns.js'
import { paneDateOf } from './pane-date-of.js'
import type { PaneRow } from './pane-row.js'
import type { PaneStackPage } from './pane-stack-page.js'
import { fitStartColumns } from './fit-start-columns.js'

/**
 * Cells before a row's glyph: the selection mark and a space.
 */
const MARK_COLUMNS = 2

/**
 * Cells a release listed under its package is pushed right by.
 */
const INDENT_COLUMNS = 2

/**
 * The most cells a version takes in its column.
 */
const VERSION_COLUMNS = 20

/**
 * The fewest cells the name column shrinks to before the notes give way.
 */
const NAME_COLUMNS = 12

/**
 * The cells the notes keep before the name column takes the rest, enough for `breaking in 30.0.0`.
 */
const NOTE_COLUMNS = 20

/**
 * Feed text as one line.
 *
 * @param text untrusted text
 */
function lineOf(text: string): string {
  return collapsedTextOf(text).trim()
}

/**
 * Spaces that bring a text to `width` cells.
 *
 * @param text the text drawn
 * @param width the column's cells
 */
function padOf(text: string, width: number): string {
  return ' '.repeat(Math.max(0, width - displayWidthOf(text)))
}

/**
 * The widest of some texts, in cells.
 *
 * @param texts the texts
 */
function widestOf(texts: readonly string[]): number {
  return texts.reduce((widest, text) => Math.max(widest, displayWidthOf(text)), 0)
}

/**
 * A level as its column names it, blank for unknown.
 *
 * @param level the release level
 */
function levelWordOf(level: StackItem['release']['level']): string {
  return level === 'unknown' ? '' : level
}

/**
 * A release's line under its package: its version, then ` · <title>` when the title says more.
 *
 * @param item the release
 */
function releaseLineOf(item: StackItem): string {
  const version = stackVersionOf(item)
  const title = lineOf(item.title)
  const isVersionOnly = title === '' || title === version || title === `v${version}`

  return isVersionOnly ? version : `${version} · ${title}`
}

/**
 * What a release's row says after its level: its flags and whether it is a pre-release.
 *
 * @param item the release
 */
function releaseNoteOf(item: StackItem): string {
  return [
    ...(item.release.security ? ['security'] : []),
    ...(item.release.breaking ? ['breaking'] : []),
    ...(item.release.isPrerelease ? ['pre-release'] : []),
  ].join(' · ')
}

/**
 * The cells of the version a package's row moves to, the changed part colored by that release's own level (the level column shows the package's highest).
 *
 * @param pkg the package
 * @param version the new version, fitted
 */
function versionCellsOf(pkg: StackPackage, version: string): PaneCell[] {
  const current = pkg.target.release.current
  const { same, changed } = versionChangeOf(
    current === undefined ? undefined : lineOf(current),
    version,
  )
  const color = levelColorOf(pkg.target.release.level)

  return [{ text: same }, color === undefined ? { text: changed } : { text: changed, color }]
}

/**
 * The stack tab's rows in the window, every line fitted to `columns` cells in aligned columns: a package as its glyph (⚠ when any release shown is flagged, else 📦), name, `current → target` (the highest stable release shown) with the changed part colored by the target's level, the package's highest level, flags naming their release, the release count and the target's date; a release of an expanded package indented beneath with its line, level, flags and date.
 *
 * @param stack the stack tab's page
 * @param selected the selected row within the window
 * @param columns the cells the pane's body has
 * @param now the clock, for the age of a release less than a day old
 */
export function paneStackRowsOf(
  stack: PaneStackPage,
  selected: number,
  columns: number,
  now: number,
): PaneRow[] {
  const fit = (text: string, width: number) => fitColumns(lineOf(text), width)
  const releases = stack.rows.flatMap(row => (row.kind === 'release' ? [row.item] : []))
  const currents = stack.packages.map(pkg => fit(pkg.target.release.current ?? '', VERSION_COLUMNS))
  const versions = stack.packages.map(pkg => fit(stackVersionOf(pkg.target), VERSION_COLUMNS))
  const currentWidth = widestOf(currents)
  const versionWidth = widestOf(versions)
  const levelWidth = widestOf([
    ...stack.packages.map(pkg => levelWordOf(pkg.level)),
    ...releases.map(item => levelWordOf(item.release.level)),
  ])
  const noteWidth = widestOf([
    ...stack.packages.map(stackPackageNoteOf),
    ...releases.map(releaseNoteOf),
  ])
  const hasDates = stack.rows.some(
    row =>
      paneDateOf((row.kind === 'package' ? row.pkg.target : row.item).publishedAt, now) !==
      undefined,
  )
  const nameWidth = widestOf(stack.packages.map(pkg => lineOf(pkg.name)))

  const levelPart = levelWidth === 0 ? 0 : 2 + levelWidth
  const datePart = hasDates ? 1 + PANE_DATE_COLUMNS : 0
  const room =
    columns -
    MARK_COLUMNS -
    ICON_COLUMNS -
    1 -
    (1 + currentWidth + 3 + versionWidth) -
    levelPart -
    datePart
  const notePart = noteWidth === 0 ? 0 : 2 + Math.min(noteWidth, NOTE_COLUMNS)
  const nameColumns = Math.max(
    1,
    Math.min(nameWidth, Math.max(Math.min(NAME_COLUMNS, room), room - notePart)),
  )
  const noteColumns = Math.max(0, Math.min(noteWidth, room - nameColumns - 2))

  // The level and note columns, padded so the dates line up.
  const tailOf = (level: string, note: string) =>
    [
      ...(levelPart === 0 ? [] : [`  ${level}${padOf(level, levelWidth)}`]),
      ...(noteColumns === 0
        ? []
        : [
            `  ${fitColumns(note, noteColumns)}${padOf(fitColumns(note, noteColumns), noteColumns)}`,
          ]),
    ].join('')

  const rowOf = (row: StackRow, index: number): PaneRow => {
    const item = row.kind === 'package' ? row.pkg.target : row.item
    const href = httpUrlOf(item.url)?.href
    const date = paneDateOf(item.publishedAt, now)
    const dated = date === undefined ? {} : { date }
    const linked = href === undefined ? {} : { href }
    const isSelected = index === selected

    if (row.kind === 'release') {
      const width = Math.max(1, nameColumns + 1 + currentWidth + 3 + versionWidth - INDENT_COLUMNS)
      const title = fit(releaseLineOf(row.item), width)
      const tail = `${padOf(title, width)}${tailOf(levelWordOf(row.item.release.level), releaseNoteOf(row.item))}`

      return {
        id: row.item.id,
        icon: fitColumns(stackIconOf(row.item.release), ICON_COLUMNS),
        title,
        ...linked,
        cells: tail === '' ? [] : [{ text: tail }],
        isIndented: true,
        ...dated,
        isSelected,
      }
    }

    const { pkg } = row
    const flags = packageFlagsOf(pkg)
    const title = lineOf(pkg.name).includes('/')
      ? fitStartColumns(lineOf(pkg.name), nameColumns)
      : fit(pkg.name, nameColumns)
    const current = fit(pkg.target.release.current ?? '', VERSION_COLUMNS)
    const version = fit(stackVersionOf(pkg.target), VERSION_COLUMNS)
    const cells: PaneCell[] = [
      { text: `${padOf(title, nameColumns)} ${padOf(current, currentWidth)}${current} → ` },
      ...versionCellsOf(pkg, version),
      {
        text: `${padOf(version, versionWidth)}${tailOf(levelWordOf(pkg.level), stackPackageNoteOf(pkg))}`,
      },
    ]

    return {
      id: `${pkg.target.sourceId}:${pkg.key}`,
      icon: fitColumns(
        stackIconOf({
          breaking: flags.breaking !== undefined,
          security: flags.security !== undefined,
        }),
        ICON_COLUMNS,
      ),
      title,
      ...linked,
      cells: cells.filter(cell => cell.text !== ''),
      ...dated,
      isSelected,
    }
  }

  return stack.shownRows.map((row, index) => {
    const drawn = rowOf(row, index)
    const before = stack.shownRows[index - 1]

    return before !== undefined && before.pkg.ecosystem === row.pkg.ecosystem
      ? drawn
      : { ...drawn, heading: fitColumns(ECOSYSTEM_LABELS[row.pkg.ecosystem], columns) }
  })
}
