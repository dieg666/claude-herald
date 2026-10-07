/** An element of a scanned document; text children are already entity-decoded. */
export type XmlElement = {
  /** The qualified name as written, prefix included (`content:encoded`). */
  readonly name: string
  readonly attrs: ReadonlyMap<string, string>
  readonly children: (XmlElement | string)[]
}
