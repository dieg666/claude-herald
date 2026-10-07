/**
 * How far the walk goes: directories at most `maxDepth` levels below the root, and at most `maxDirs` directory listings per detection.
 */
export const WALK_LIMITS = { maxDepth: 4, maxDirs: 500 } as const
