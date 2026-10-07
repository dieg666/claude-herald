/**
 * Each directive line of a go.mod or go.work, `require (...)` style blocks unfolded: the verb and the line's text, comments kept.
 *
 * @param text the file
 */
export function goDirectivesOf(text: string): { verb: string; line: string }[] {
  const out: { verb: string; line: string }[] = []
  let block: string | undefined

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()

    if (block !== undefined) {
      if (line.startsWith(')')) {
        block = undefined
      } else if (line !== '' && !line.startsWith('//')) {
        out.push({ verb: block, line })
      }
    } else {
      const match = /^([a-z]+)\s*(\(?)\s*(.*)$/.exec(line)

      if (match !== null && match[2] === '(') {
        block = match[1]
      } else if (match !== null && (match[3] ?? '') !== '') {
        out.push({ verb: match[1] ?? '', line: match[3] ?? '' })
      }
    }
  }

  if (block !== undefined) {
    throw new Error(`unterminated ${block} block`)
  }

  return out
}
