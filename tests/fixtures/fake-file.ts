/**
 * One entry of a fake project tree: a file's text, or a file with a reported size, a symbolic link or an empty directory.
 */
export type FakeFile = string | { text?: string; size?: number; isLink?: true; isDir?: true }
