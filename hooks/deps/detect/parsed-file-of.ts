import type { ProjectFiles } from './project-files.js'

/**
 * Each scan's parse results by parser and path, so a file is parsed and reported once.
 */
const PARSED = new WeakMap<ProjectFiles, Map<unknown, Map<string, unknown>>>()

/**
 * A file parsed, or undefined (with one debug line the first time) when it is missing or does not parse; each file is parsed once per parser.
 *
 * @param files the files read
 * @param path the file, relative to the root
 * @param parse the parser; it throws on a broken file
 */
export function parsedFileOf<T>(
  files: ProjectFiles,
  path: string,
  parse: (text: string) => T,
): T | undefined {
  const text = files.texts.get(path)

  if (text === undefined) {
    return undefined
  }

  const byParser = PARSED.get(files) ?? new Map<unknown, Map<string, unknown>>()
  const byPath = byParser.get(parse) ?? new Map<string, unknown>()

  PARSED.set(files, byParser)
  byParser.set(parse, byPath)

  if (byPath.has(path)) {
    return byPath.get(path) as T | undefined
  }

  try {
    const value = parse(text)

    byPath.set(path, value)

    return value
  } catch (error) {
    files.debug(`skipped ${path}: ${error instanceof Error ? error.message : String(error)}`)
    byPath.set(path, undefined)

    return undefined
  }
}
