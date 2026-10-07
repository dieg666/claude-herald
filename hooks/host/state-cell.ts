/**
 * One `$.state` value as `register.tsx` binds it: `read($, atom)` and `update($, atom, change)`.
 */
export type StateCell<T> = {
  /**
   * The value, its initial while unwritten.
   */
  read: () => Promise<T>

  /**
   * Writes the value from the current one, retrying on a concurrent write; resolves what it wrote.
   */
  update: (change: (value: T) => T) => Promise<T>
}
