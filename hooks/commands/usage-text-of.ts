import { COMMAND_NAME } from '../names/command-name.js'
import type { Subcommand } from './subcommand.js'

/**
 * The usage text: `/news` alone, then every subcommand in table order with what it does, then help.
 *
 * @param subcommands the subcommands by name
 */
export function usageTextOf(subcommands: Readonly<Record<string, Subcommand>>): string {
  const rows: [string, string][] = [
    [`/${COMMAND_NAME}`, 'open the news pane, or list the latest items where no pane is drawn'],
    ...Object.values(subcommands).map((subcommand): [string, string] => [
      `/${COMMAND_NAME} ${subcommand.usage}`,
      subcommand.summary,
    ]),
    [`/${COMMAND_NAME} help`, 'show this list'],
  ]

  const width = Math.max(...rows.map(([usage]) => usage.length))

  return ['Usage:', ...rows.map(([usage, summary]) => `  ${usage.padEnd(width)}  ${summary}`)].join(
    '\n',
  )
}
