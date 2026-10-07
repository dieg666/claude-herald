const closesAfter = (json: string, from: number) => {
  let index = from

  while (/\s/.test(json[index] ?? 'x')) {
    index++
  }

  return json[index] === ']' || json[index] === '}'
}

/**
 * JSON text without the commas that directly precede a closing bracket or brace, outside strings.
 *
 * @param json the JSON text
 * @returns the text without trailing commas
 */
export const withoutTrailingCommas = (json: string) => {
  let result = ''
  let inString = false

  for (let index = 0; index < json.length; index++) {
    const character = json[index] ?? ''

    if (inString) {
      result += character

      if (character === '\\') {
        index++
        result += json[index] ?? ''
      } else if (character === '"') {
        inString = false
      }

      continue
    }

    if (character === '"') {
      inString = true
    } else if (character === ',' && closesAfter(json, index + 1)) {
      continue
    }

    result += character
  }

  return result
}
