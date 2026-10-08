import { COMMAND_NAME } from '../names/command-name.js'
import type { Subcommand } from './subcommand.js'

/**
 * The usage text of `/herald deps`: the listing, then every subcommand in table order with what it does, then help.
 *
 * @param subcommands the deps subcommands by name
 */
export function depsUsageTextOf(subcommands: Readonly<Record<string, Subcommand>>): string {
  const prefix = `/${COMMAND_NAME} deps`
  const rows: [string, string][] = [
    [prefix, "this project's stack: settings, followed packages and their release feeds"],
    ...Object.values(subcommands).map((subcommand): [string, string] => [
      `${prefix} ${subcommand.usage}`,
      subcommand.summary,
    ]),
    [`${prefix} help`, 'show this list'],
  ]

  const width = Math.max(...rows.map(([usage]) => usage.length))

  return ['Usage:', ...rows.map(([usage, summary]) => `  ${usage.padEnd(width)}  ${summary}`)].join(
    '\n',
  )
}
