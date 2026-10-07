/**
 * A TOML table as parsed: nested objects, arrays and scalars.
 */
type Table = Record<string, unknown>

/**
 * Whether a value is a table (not null, not an array).
 *
 * @param value a parsed value
 */
function isTable(value: unknown): value is Table {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * A cursor over the text with the reading primitives the grammar needs.
 */
class Reader {
  index = 0

  constructor(readonly text: string) {}

  /**
   * The character at the cursor plus an offset, or '' past the end.
   *
   * @param offset how far ahead
   */
  peek(offset = 0): string {
    return this.text[this.index + offset] ?? ''
  }

  /**
   * Whether the text continues with this string at the cursor.
   *
   * @param prefix what to look for
   */
  startsWith(prefix: string): boolean {
    return this.text.startsWith(prefix, this.index)
  }

  /**
   * Throws a syntax error naming the line.
   *
   * @param message what went wrong
   */
  fail(message: string): never {
    const line = this.text.slice(0, this.index).split('\n').length

    throw new Error(`TOML line ${line}: ${message}`)
  }

  /**
   * Skips spaces and tabs.
   */
  skipBlanks(): void {
    while (this.peek() === ' ' || this.peek() === '\t') {
      this.index += 1
    }
  }

  /**
   * Skips blanks, newlines and comments.
   */
  skipLayout(): void {
    for (;;) {
      this.skipBlanks()

      if (this.peek() === '#') {
        this.skipComment()
      } else if (this.peek() === '\n' || this.peek() === '\r') {
        this.index += 1
      } else {
        return
      }
    }
  }

  /**
   * Skips a comment up to the end of its line.
   */
  skipComment(): void {
    while (this.peek() !== '' && this.peek() !== '\n') {
      this.index += 1
    }
  }

  /**
   * Requires the end of a line (after blanks and a comment).
   */
  endLine(): void {
    this.skipBlanks()

    if (this.peek() === '#') {
      this.skipComment()
    }

    if (this.peek() === '\r') {
      this.index += 1
    }

    if (this.peek() !== '\n' && this.peek() !== '') {
      this.fail(`unexpected '${this.peek()}'`)
    }
  }
}

/**
 * Reads one escape after a backslash in a basic string.
 *
 * @param reader the cursor, on the character after the backslash
 */
function escapeOf(reader: Reader): string {
  const char = reader.peek()
  const simple: Record<string, string> = {
    b: '\b',
    t: '\t',
    n: '\n',
    f: '\f',
    r: '\r',
    e: '\u001b',
    '"': '"',
    '\\': '\\',
  }

  if (char in simple) {
    reader.index += 1

    return simple[char] ?? ''
  }

  const width = char === 'u' ? 4 : char === 'U' ? 8 : char === 'x' ? 2 : 0
  const hex = reader.text.slice(reader.index + 1, reader.index + 1 + width)

  if (width === 0 || !/^[0-9A-Fa-f]+$/.test(hex) || hex.length !== width) {
    reader.fail('bad escape')
  }

  reader.index += 1 + width

  return String.fromCodePoint(parseInt(hex, 16))
}

/**
 * Reads a basic ("...") or multi-line basic ("""...""") string.
 *
 * @param reader the cursor, on the opening quote
 */
function basicStringOf(reader: Reader): string {
  const isMulti = reader.startsWith('"""')
  let out = ''

  reader.index += isMulti ? 3 : 1

  if (isMulti && reader.peek() === '\n') {
    reader.index += 1
  } else if (isMulti && reader.startsWith('\r\n')) {
    reader.index += 2
  }

  for (;;) {
    const char = reader.peek()

    if (char === '') {
      reader.fail('unterminated string')
    }

    if (isMulti ? reader.startsWith('"""') && reader.peek(3) !== '"' : char === '"') {
      reader.index += isMulti ? 3 : 1

      return out
    }

    if (!isMulti && char === '\n') {
      reader.fail('newline in a string')
    }

    if (char === '\\') {
      reader.index += 1

      if (isMulti && /^[ \t]*\r?\n/.test(reader.text.slice(reader.index, reader.index + 64))) {
        while (/[ \t\r\n]/.test(reader.peek()) && reader.peek() !== '') {
          reader.index += 1
        }
      } else {
        out += escapeOf(reader)
      }
    } else {
      out += char
      reader.index += 1
    }
  }
}

/**
 * Reads a literal ('...') or multi-line literal ('''...''') string.
 *
 * @param reader the cursor, on the opening quote
 */
function literalStringOf(reader: Reader): string {
  const isMulti = reader.startsWith("'''")
  const close = isMulti ? "'''" : "'"

  reader.index += close.length

  if (isMulti && reader.peek() === '\n') {
    reader.index += 1
  } else if (isMulti && reader.startsWith('\r\n')) {
    reader.index += 2
  }

  let end = reader.text.indexOf(close, reader.index)

  while (isMulti && end >= 0 && reader.text[end + 3] === "'") {
    end += 1
  }

  if (end < 0) {
    reader.fail('unterminated string')
  }

  const out = reader.text.slice(reader.index, end)

  if (!isMulti && out.includes('\n')) {
    reader.fail('newline in a string')
  }

  reader.index = end + close.length

  return out
}

/**
 * Reads one key part: bare, basic-quoted or literal-quoted.
 *
 * @param reader the cursor
 */
function keyPartOf(reader: Reader): string {
  reader.skipBlanks()

  if (reader.peek() === '"') {
    return basicStringOf(reader)
  }

  if (reader.peek() === "'") {
    return literalStringOf(reader)
  }

  const match = /^[A-Za-z0-9_-]+/.exec(reader.text.slice(reader.index, reader.index + 256))

  if (match === null) {
    reader.fail('expected a key')
  }

  reader.index += match[0].length

  return match[0]
}

/**
 * Reads a dotted key such as `a."b c".d`.
 *
 * @param reader the cursor
 */
function keyOf(reader: Reader): string[] {
  const parts = [keyPartOf(reader)]

  reader.skipBlanks()

  while (reader.peek() === '.') {
    reader.index += 1
    parts.push(keyPartOf(reader))
    reader.skipBlanks()
  }

  return parts
}

/**
 * Reads an array, across lines and comments.
 *
 * @param reader the cursor, on `[`
 */
function arrayOf(reader: Reader): unknown[] {
  const out: unknown[] = []

  reader.index += 1

  for (;;) {
    reader.skipLayout()

    if (reader.peek() === ']') {
      reader.index += 1

      return out
    }

    out.push(valueOf(reader))
    reader.skipLayout()

    if (reader.peek() === ',') {
      reader.index += 1
    } else if (reader.peek() !== ']') {
      reader.fail('expected , or ] in an array')
    }
  }
}

/**
 * Reads an inline table, allowing newlines and a trailing comma.
 *
 * @param reader the cursor, on `{`
 */
function inlineTableOf(reader: Reader): Table {
  const out: Table = {}

  reader.index += 1

  for (;;) {
    reader.skipLayout()

    if (reader.peek() === '}') {
      reader.index += 1

      return out
    }

    const key = keyOf(reader)

    reader.skipBlanks()

    if (reader.peek() !== '=') {
      reader.fail('expected = in an inline table')
    }

    reader.index += 1
    reader.skipBlanks()
    assign(reader, out, key, valueOf(reader))
    reader.skipLayout()

    if (reader.peek() === ',') {
      reader.index += 1
    } else if (reader.peek() !== '}') {
      reader.fail('expected , or } in an inline table')
    }
  }
}

/**
 * Reads a bare value: a boolean, number or date, kept as a string unless boolean or a plain number.
 *
 * @param reader the cursor
 */
function bareValueOf(reader: Reader): unknown {
  const match = /^[A-Za-z0-9_+\-.:]+(?:[ T][0-9][0-9:.+\-Z]*)?/.exec(
    reader.text.slice(reader.index, reader.index + 128),
  )

  if (match === null) {
    reader.fail(`unexpected '${reader.peek()}'`)
  }

  reader.index += match[0].length

  const raw = match[0]

  if (raw === 'true' || raw === 'false') {
    return raw === 'true'
  }

  if (/^[+-]?(?:\d[\d_]*)(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?$/.test(raw)) {
    return Number(raw.replace(/_/g, ''))
  }

  if (/^(?:[+-]?(?:inf|nan)|0x[0-9A-Fa-f_]+|0o[0-7_]+|0b[01_]+)$/.test(raw) || /^\d/.test(raw)) {
    return raw
  }

  return reader.fail(`unexpected value '${raw}'`)
}

/**
 * Reads any value.
 *
 * @param reader the cursor, on the value's first character
 */
function valueOf(reader: Reader): unknown {
  const char = reader.peek()

  if (char === '"') {
    return basicStringOf(reader)
  }

  if (char === "'") {
    return literalStringOf(reader)
  }

  if (char === '[') {
    return arrayOf(reader)
  }

  if (char === '{') {
    return inlineTableOf(reader)
  }

  return bareValueOf(reader)
}

/**
 * The table at a dotted path under `root`, created as needed; the last element when the path ends in an array of tables.
 *
 * @param reader the cursor, for errors
 * @param root where to start
 * @param path the dotted key
 */
function tableAt(reader: Reader, root: Table, path: readonly string[]): Table {
  let table = root

  for (const part of path) {
    const value = Object.hasOwn(table, part) ? table[part] : undefined

    if (value === undefined) {
      const created: Table = {}

      table[part] = created
      table = created
    } else if (Array.isArray(value) && isTable(value[value.length - 1])) {
      table = value[value.length - 1] as Table
    } else if (isTable(value)) {
      table = value
    } else {
      reader.fail(`'${part}' is not a table`)
    }
  }

  return table
}

/**
 * Sets a dotted key in a table.
 *
 * @param reader the cursor, for errors
 * @param table the table the key is relative to
 * @param key the dotted key
 * @param value what to set
 */
function assign(reader: Reader, table: Table, key: readonly string[], value: unknown): void {
  const last = key[key.length - 1]

  if (last === undefined) {
    reader.fail('empty key')
  }

  tableAt(reader, table, key.slice(0, -1))[last] = value
}

/**
 * Parses TOML into plain objects: strings, numbers, booleans, arrays and tables; dates stay strings. Lenient about redefinitions; throws on anything it cannot read.
 *
 * @param text the document
 */
export function parseToml(text: string): Record<string, unknown> {
  const reader = new Reader(text.replace(/^﻿/, ''))
  const root: Table = {}
  let current = root

  for (;;) {
    reader.skipLayout()

    if (reader.peek() === '') {
      return root
    }

    if (reader.peek() === '[') {
      const isArray = reader.startsWith('[[')

      reader.index += isArray ? 2 : 1

      const path = keyOf(reader)

      if (!reader.startsWith(isArray ? ']]' : ']')) {
        reader.fail('unterminated table header')
      }

      reader.index += isArray ? 2 : 1

      if (isArray) {
        const parent = tableAt(reader, root, path.slice(0, -1))
        const last = path[path.length - 1] ?? ''
        const existing = Object.hasOwn(parent, last) ? parent[last] : undefined
        const list = Array.isArray(existing) ? existing : []
        const created: Table = {}

        list.push(created)
        parent[last] = list
        current = created
      } else {
        current = tableAt(reader, root, path)
      }
    } else {
      const key = keyOf(reader)

      reader.skipBlanks()

      if (reader.peek() !== '=') {
        reader.fail('expected =')
      }

      reader.index += 1
      reader.skipBlanks()
      assign(reader, current, key, valueOf(reader))
    }

    reader.endLine()
  }
}
