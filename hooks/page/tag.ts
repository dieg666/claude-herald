/**
 * A start or end tag read from markup.
 */
export type Tag = {
  /** The tag name in lower case. */
  name: string
  closing: boolean
  /** Whether the tag ends in `/>`. */
  selfClosing: boolean
  /** Attribute values by lower-case name, entities decoded; the first occurrence wins. */
  attributes: ReadonlyMap<string, string>
  /** The index just past the tag; the end of the markup when the tag never closes. */
  end: number
}
