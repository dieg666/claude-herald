/**
 * One meaningful line: its indentation, its content without the comment, and the raw text for block scalars.
 */
type Line = { indent: number; text: string; raw: string }

/**
 * A line's content with a trailing comment removed, quotes respected.
 *
 * @param text the line after its indentation
 */
function withoutComment(text: string): string {
  let quote = ''

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (quote !== '') {
      if (char === '\\' && quote === '"') {
        index += 1
      } else if (char === quote) {
        quote = ''
      }
    } else if (char === '"' || char === "'") {
      quote = char
    } else if (
      char === '#' &&
      (index === 0 || text[index - 1] === ' ' || text[index - 1] === '\t')
    ) {
      return text.slice(0, index).trimEnd()
    }
  }

  return text.trimEnd()
}

/**
 * A quoted scalar's value: double quotes with escapes, single quotes with '' for a quote.
 *
 * @param text the scalar, quotes included
 */
function unquoted(text: string): string {
  if (text.startsWith("'")) {
    return text.slice(1, -1).replace(/''/g, "'")
  }

  return text.slice(1, -1).replace(/\\(u[0-9A-Fa-f]{4}|.)/g, (_, escape: string) => {
    const simple: Record<string, string> = { n: '\n', t: '\t', r: '\r', '0': '\0' }

    return escape.length === 5
      ? String.fromCharCode(parseInt(escape.slice(1), 16))
      : (simple[escape] ?? escape)
  })
}

/**
 * A scalar: quoted strings unquoted, `null`, `~` and empty as null, everything else kept as its text.
 *
 * @param text the scalar as written
 */
function scalarOf(text: string): unknown {
  const value = text.trim()

  if (value === '' || value === '~' || value === 'null') {
    return null
  }

  if (
    (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
    (value.startsWith("'") && value.endsWith("'") && value.length > 1)
  ) {
    return unquoted(value)
  }

  return value
}

/**
 * Splits a flow collection's inside on top-level commas, quotes and brackets respected.
 *
 * @param text the inside, without the outer brackets
 */
function flowPartsOf(text: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote = ''
  let start = 0

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (quote !== '') {
      if (char === quote) {
        quote = ''
      }
    } else if (char === '"' || char === "'") {
      quote = char
    } else if (char === '[' || char === '{') {
      depth += 1
    } else if (char === ']' || char === '}') {
      depth -= 1
    } else if (char === ',' && depth === 0) {
      parts.push(text.slice(start, index))
      start = index + 1
    }
  }

  parts.push(text.slice(start))

  return parts.map(part => part.trim()).filter(part => part !== '')
}

/**
 * The index of the quote that closes a quoted scalar starting the text, or -1 when it is not closed.
 *
 * @param text a text starting with `"` or `'`
 */
function quoteEndOf(text: string): number {
  const quote = text[0] ?? ''
  let index = 1

  while (index < text.length) {
    if (text[index] === '\\' && quote === '"') {
      index += 2
    } else if (text[index] === quote) {
      if (quote === "'" && text[index + 1] === "'") {
        index += 2
      } else {
        return index
      }
    } else {
      index += 1
    }
  }

  return -1
}

/**
 * Where a mapping key ends in a line (the index of its `:`), or -1 when the line is not a `key: value` entry.
 *
 * @param text the line's content
 */
function keyEndOf(text: string): number {
  if (text.startsWith('"') || text.startsWith("'")) {
    const index = quoteEndOf(text)

    if (index < 0) {
      return -1
    }

    const rest = text.slice(index + 1)

    return /^\s*:(?:\s|$)/.test(rest) ? index + 1 + rest.indexOf(':') : -1
  }

  if (/^[[{]/.test(text)) {
    return -1
  }

  const match = /:(?:\s|$)/.exec(text)

  return match === null ? -1 : match.index
}

/**
 * A flow collection (`[a, b]` or `{a: b}`) as plain data.
 *
 * @param text the collection, brackets included
 */
function flowOf(text: string): unknown {
  const inside = text.slice(1, -1)

  if (text.startsWith('[')) {
    return flowPartsOf(inside).map(part => (/^[[{]/.test(part) ? flowOf(part) : scalarOf(part)))
  }

  return Object.fromEntries(
    flowPartsOf(inside).map(part => {
      const end = keyEndOf(part)
      const key = end < 0 ? part : part.slice(0, end)
      const value = end < 0 ? '' : part.slice(end + 1).trim()

      return [scalarOf(key), /^[[{]/.test(value) ? flowOf(value) : scalarOf(value)]
    }),
  )
}

/**
 * Whether brackets outside quotes balance in a text.
 *
 * @param text a flow collection, maybe partial
 */
function isBalanced(text: string): boolean {
  let depth = 0
  let quote = ''

  for (const char of text) {
    if (quote !== '') {
      quote = char === quote ? '' : quote
    } else if (char === '"' || char === "'") {
      quote = char
    } else if (char === '[' || char === '{') {
      depth += 1
    } else if (char === ']' || char === '}') {
      depth -= 1
    }
  }

  return depth <= 0
}

/**
 * A reader over the meaningful lines of one document.
 */
class Parser {
  index = 0

  constructor(readonly lines: Line[]) {}

  /**
   * A value written after `key:` or `- `: a flow collection (maybe over several lines), a block scalar, a nested block, or a scalar.
   *
   * @param text what follows the indicator on its line
   * @param indent the indentation of the line it is on
   */
  inlineValue(text: string, indent: number): unknown {
    if (/^[|>][-+0-9]*$/.test(text)) {
      return this.blockScalar(indent, text.startsWith('>'))
    }

    if (/^[[{]/.test(text)) {
      let flow = text

      while (!isBalanced(flow) && this.index < this.lines.length) {
        flow += ` ${this.lines[this.index]?.text ?? ''}`
        this.index += 1
      }

      if (!isBalanced(flow) || !/[\]}]$/.test(flow)) {
        throw new Error(`YAML: unterminated flow collection near '${text.slice(0, 40)}'`)
      }

      return flowOf(flow)
    }

    if (text === '') {
      const next = this.lines[this.index]

      if (next !== undefined && next.indent > indent) {
        return this.block(next.indent)
      }

      if (next !== undefined && next.indent === indent && /^-(?:\s|$)/.test(next.text)) {
        return this.block(indent)
      }

      return null
    }

    let scalar = text

    if (/^["']/.test(scalar)) {
      while (quoteEndOf(scalar) < 0 && this.index < this.lines.length) {
        scalar += ` ${this.lines[this.index]?.text ?? ''}`
        this.index += 1
      }
    } else {
      for (let next = this.lines[this.index]; next !== undefined && next.indent > indent;) {
        if (keyEndOf(next.text) >= 0 || /^-(?:\s|$)/.test(next.text)) {
          throw new Error(`YAML: unexpected indentation at '${next.text.slice(0, 40)}'`)
        }

        scalar += ` ${next.text}`
        this.index += 1
        next = this.lines[this.index]
      }
    }

    return scalarOf(scalar)
  }

  /**
   * The lines of a `|` or `>` scalar: every following line indented deeper than its key.
   *
   * @param indent the key's indentation
   * @param isFolded whether lines are joined with spaces
   */
  blockScalar(indent: number, isFolded: boolean): string {
    const parts: string[] = []

    while ((this.lines[this.index]?.indent ?? -1) > indent) {
      parts.push((this.lines[this.index]?.raw ?? '').trim())
      this.index += 1
    }

    return parts.join(isFolded ? ' ' : '\n')
  }

  /**
   * A mapping or a sequence whose entries sit at this indentation.
   *
   * @param indent the entries' indentation
   */
  block(indent: number): unknown {
    const first = this.lines[this.index]

    if (first === undefined) {
      return null
    }

    return /^-(?:\s|$)/.test(first.text) ? this.sequence(indent) : this.mapping(indent)
  }

  /**
   * A block sequence at this indentation.
   *
   * @param indent the dashes' indentation
   */
  sequence(indent: number): unknown[] {
    const out: unknown[] = []

    for (;;) {
      const line = this.lines[this.index]

      if (line === undefined || line.indent !== indent || !/^-(?:\s|$)/.test(line.text)) {
        if (line !== undefined && line.indent > indent) {
          throw new Error(`YAML: unexpected indentation at '${line.text.slice(0, 40)}'`)
        }

        return out
      }

      const rest = line.text.slice(1).trimStart()
      const column = indent + (line.text.length - rest.length)

      this.index += 1

      if (rest !== '' && keyEndOf(rest) >= 0 && !/^[[{]/.test(rest)) {
        this.index -= 1
        this.lines[this.index] = { indent: column, text: rest, raw: rest }
        out.push(this.mapping(column))
      } else {
        out.push(this.inlineValue(rest, indent))
      }
    }
  }

  /**
   * A block mapping at this indentation.
   *
   * @param indent the keys' indentation
   */
  mapping(indent: number): Record<string, unknown> {
    const out: Record<string, unknown> = {}

    for (;;) {
      const line = this.lines[this.index]

      if (line === undefined || line.indent < indent) {
        return out
      }

      if (line.indent > indent) {
        throw new Error(`YAML: unexpected indentation at '${line.text.slice(0, 40)}'`)
      }

      if (/^-(?:\s|$)/.test(line.text)) {
        return out
      }

      const end = keyEndOf(line.text)

      if (end < 0) {
        throw new Error(`YAML: expected 'key: value' at '${line.text.slice(0, 40)}'`)
      }

      const key = scalarOf(line.text.slice(0, end))

      this.index += 1
      out[String(key)] = this.inlineValue(line.text.slice(end + 1).trim(), indent)
    }
  }
}

/**
 * The meaningful lines of a document: blank and comment-only lines dropped, block-scalar lines kept raw.
 *
 * @param text one document
 */
function linesOf(text: string): Line[] {
  return text.split(/\r?\n/).flatMap(raw => {
    const content = raw.replace(/^[ ]*/, '')
    const indent = raw.length - content.length

    if (content.startsWith('\t')) {
      throw new Error('YAML: tab indentation')
    }

    const stripped = withoutComment(content)

    return stripped === '' ? [] : [{ indent, text: stripped, raw }]
  })
}

/**
 * Parses the subset of YAML that manifests and lockfiles use: block mappings and sequences, flow collections, quoted and plain scalars, block scalars and `---` documents. Scalars stay strings (`1.10` is not a number); `null`, `~` and empty values are null. Throws on what it cannot read.
 *
 * @param text the file
 * @returns each document's value, in order
 */
export function parseYaml(text: string): unknown[] {
  const documents = text
    .replace(/^\ufeff/, '')
    .split(/^(?:---|\.\.\.)[ \t]*(?:#.*)?$/m)
    .map(linesOf)
    .filter(lines => lines.length > 0)

  return documents.map(lines => {
    const parser = new Parser(lines)
    const value = parser.block(lines[0]?.indent ?? 0)

    if (parser.index < parser.lines.length) {
      throw new Error(
        `YAML: unexpected line '${parser.lines[parser.index]?.text.slice(0, 40) ?? ''}'`,
      )
    }

    return value
  })
}
