/**
 * Where the JSON array or object that starts at `start` closes.
 *
 * @param text the text holding the value, read with strings and escapes so a bracket in a string does not count
 * @param start the index of its `[` or `{`
 * @returns the index just past the matching closer, or -1 when the brackets never balance
 */
export const balancedEnd = (text: string, start: number) => {
  const closers: string[] = []
  let inString = false

  for (let index = start; index < text.length; index++) {
    const character = text[index]

    if (inString) {
      if (character === '\\') {
        index++
      } else if (character === '"') {
        inString = false
      }

      continue
    }

    if (character === '"') {
      inString = true
    } else if (character === '[') {
      closers.push(']')
    } else if (character === '{') {
      closers.push('}')
    } else if (character === ']' || character === '}') {
      if (closers.pop() !== character) {
        return -1
      }

      if (closers.length === 0) {
        return index + 1
      }
    }
  }

  return -1
}
