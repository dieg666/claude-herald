/** Why a document is not a usable feed: blank, not RSS or Atom, or cut short. */
export type FeedFailure = 'empty' | 'not-a-feed' | 'truncated'
