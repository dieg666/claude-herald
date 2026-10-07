/**
 * What checking a repository's feeds came to: the feed to follow, a definite none (cached), or a failure worth trying again later.
 */
export type FeedCheck =
  | { readonly kind: 'feed'; readonly feed: string }
  | { readonly kind: 'none'; readonly reason: string }
  | { readonly kind: 'failed'; readonly reason: string }
