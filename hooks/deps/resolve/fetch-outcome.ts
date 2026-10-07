/**
 * What one request came to: the body, a definite not-found, or a failure worth trying again later.
 */
export type FetchOutcome =
  | { readonly kind: 'ok'; readonly text: string }
  | { readonly kind: 'missing'; readonly status: number }
  | { readonly kind: 'failed'; readonly reason: string }
