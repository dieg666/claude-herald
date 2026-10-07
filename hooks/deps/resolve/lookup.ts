/**
 * Where a package's code lives: a GitHub repository, a definite none (cached), or a failure worth trying again later (not cached).
 */
export type Lookup =
  | { readonly kind: 'repo'; readonly repo: string }
  | { readonly kind: 'none'; readonly reason: string }
  | { readonly kind: 'failed'; readonly reason: string }
