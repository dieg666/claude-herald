import { charWidthOf } from '../band/char-width-of.js'
import { displayWidthOf } from '../band/display-width-of.js'
import { fitColumns } from '../band/fit-columns.js'

/**
 * A word cut into pieces of at most `columns` cells each.
 *
 * @param word one word, no spaces
 * @param columns the cells a piece may take, at least 1
 */
function piecesOf(word: string, columns: number): string[] {
  const pieces: string[] = []
  let piece = ''
  let width = 0

  for (const char of word) {
    const cells = charWidthOf(char)

    if (width > 0 && width + cells > columns) {
      pieces.push(piece)
      piece = ''
      width = 0
    }

    piece += char
    width += cells
  }

  return piece === '' ? pieces : [...pieces, piece]
}

/**
 * A line wrapped at spaces into at most `maxLines` lines of `columns` cells, a word wider than a line cut; when text is left over the last line ends in an ellipsis, after its last whole word that leaves room; none when nothing fits.
 *
 * @param text one line, control characters already removed
 * @param columns the cells a line may take
 * @param maxLines the most lines
 */
export function wrapColumns(text: string, columns: number, maxLines: number): string[] {
  if (columns < 1 || maxLines < 1) {
    return []
  }

  const lines: string[] = []
  let line = ''

  for (const word of text.split(' ').filter(word => word !== '')) {
    for (const piece of displayWidthOf(word) > columns ? piecesOf(word, columns) : [word]) {
      if (line !== '' && displayWidthOf(line) + 1 + displayWidthOf(piece) <= columns) {
        line = `${line} ${piece}`
      } else {
        if (line !== '') {
          lines.push(line)
        }

        line = piece
      }
    }
  }

  const all = line === '' ? lines : [...lines, line]

  if (all.length <= maxLines) {
    return all
  }

  const words = (all[maxLines - 1] ?? '').split(' ')

  while (words.length > 1 && displayWidthOf(`${words.join(' ')}…`) > columns) {
    words.pop()
  }

  return [...all.slice(0, maxLines - 1), fitColumns(`${words.join(' ')}…`, columns)]
}
