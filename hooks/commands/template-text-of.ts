/**
 * A typed template without a pair of quotes that encloses all of it and appears nowhere inside, trimmed.
 *
 * @param rest what follows the subcommand
 */
export function templateTextOf(rest: string): string {
  const match = /^(["'])([\s\S]*)\1$/.exec(rest)
  const [, quote = '', inner = ''] = match ?? []

  return (match === null || inner.includes(quote) ? rest : inner).trim()
}
