/**
 * Each place where a page repeats a source while another source still has items from there on, as `page <n>: <source>` (empty when none).
 *
 * @param sourceIds the source of each item, in band order
 * @param size how many items a page holds
 */
export function pageRepeatsOf(sourceIds: readonly string[], size = 3): string[] {
  return sourceIds.flatMap((sourceId, index) => {
    const page = sourceIds.slice(index - (index % size), index)
    const hasOther = sourceIds.slice(index).some(other => !page.includes(other))

    return page.includes(sourceId) && hasOther
      ? [`page ${Math.floor(index / size) + 1}: ${sourceId}`]
      : []
  })
}
