import type { Dependency } from '../../../types/index.js'
import type { ProjectFiles } from './project-files.js'
import type { Workspace } from './workspace.js'

/**
 * What one ecosystem reads: which files, which workspaces they declare, and the dependencies they declare.
 */
export type Detector = {
  /** Whether a file by this name declares dependencies. */
  isManifest: (name: string) => boolean
  /** Whether a file by this name is read alongside the manifests: a lockfile or a workspace file. */
  isCompanion: (name: string) => boolean
  /** The workspaces the files declare. */
  workspacesOf: (files: ProjectFiles) => Workspace[]
  /** Every dependency the given manifests declare, each version from the nearest lockfile when there is one. */
  depsOf: (files: ProjectFiles, manifests: readonly string[]) => Dependency[]
}
