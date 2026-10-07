/**
 * The files one detection read, what every parser works from.
 */
export type ProjectFiles = {
  /** Each file's text by path relative to the project root, `/`-separated. */
  texts: ReadonlyMap<string, string>
  /** One line in the debug log. */
  debug: (text: string) => void
}
