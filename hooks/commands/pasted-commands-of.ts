/**
 * The commands in what follows `/herald`, each trimmed: the first is the first line with the lines after it up to the next line that starts with `/` (blank when `/herald` stood alone on its line), and each such line starts the next, the lines after it that do not start with `/` joined to it with `\n`; any line break (`\n`, `\r\n` or `\r`) counts.
 *
 * @param args everything after `/herald`
 */
export function pastedCommandsOf(args: string): string[] {
  const [first = '', ...rest] = args.split(/\r\n|\r|\n/)
  const commands: string[][] = [[first]]

  for (const line of rest) {
    if (line.trimStart().startsWith('/')) {
      commands.push([line])
    } else {
      commands[commands.length - 1]?.push(line)
    }
  }

  return commands.map(lines => lines.join('\n').trim())
}
