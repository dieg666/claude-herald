/**
 * What a pasted command asks of `/herald`: the text after a leading `/herald` (any case), the text itself when it has none, or undefined when it starts with another slash command.
 *
 * @param command one trimmed command of a paste, its continuation lines included
 */
export function heraldArgsOf(command: string): string | undefined {
  const match = /^\/herald(?=\s|$)([\s\S]*)$/i.exec(command)

  if (match !== null) {
    return (match[1] ?? '').trim()
  }

  return command.startsWith('/') ? undefined : command
}
