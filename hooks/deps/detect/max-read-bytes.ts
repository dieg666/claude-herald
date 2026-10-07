/**
 * The largest file the engine reads (4 MiB); a bigger manifest or lockfile is skipped as broken.
 */
export const MAX_READ_BYTES = 4 * 1024 * 1024
