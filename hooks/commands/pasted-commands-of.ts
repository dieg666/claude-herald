/**
 * The commands in what follows `/herald`, each trimmed and blank ones dropped: the first is the text before the first line that starts with `/`, and each such line starts the next, the lines after it that do not start with `/` joined to it with `\n`; any line break (`\n`, `\r\n` or `\r`) counts.
 *
 * @param args everything after `/herald`
 */
export function pastedCommandsOf(args: string): string[] {
  const commands: string[][] = [[]]

  for (const line of args.split(/\r\n|\r|\n/)) {
    if (line.trimStart().startsWith('/')) {
      commands.push([line])
    } else {
      commands[commands.length - 1]?.push(line)
    }
  }

  return commands.map(lines => lines.join('\n').trim()).filter(command => command !== '')
}
