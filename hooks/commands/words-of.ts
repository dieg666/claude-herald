const QUOTES = new Set(['"', "'"])

/**
 * The words of a command line, split on whitespace: a quote that starts a word opens a span kept whole without its quotes, closed by the same quote before whitespace or the end (an unclosed span runs to the end); any other quote is literal.
 *
 * @param text what follows the command
 */
export function wordsOf(text: string): string[] {
  const chars = [...text]
  const words: string[] = []
  let word = ''
  let isWord = false
  let quote: string | undefined

  chars.forEach((char, index) => {
    const next = chars[index + 1]

    if (quote !== undefined) {
      if (char === quote && (next === undefined || /\s/.test(next))) {
        quote = undefined
      } else {
        word += char
      }
    } else if (!isWord && QUOTES.has(char)) {
      quote = char
      isWord = true
    } else if (/\s/.test(char)) {
      if (isWord) {
        words.push(word)
      }

      word = ''
      isWord = false
    } else {
      word += char
      isWord = true
    }
  })

  if (isWord) {
    words.push(word)
  }

  return words
}
