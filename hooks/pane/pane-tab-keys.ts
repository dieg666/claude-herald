/**
 * The footer's keys by kind of tab, in the order drawn, only those that act there: Saved has mark-as-read in place of Save (its items are saved already), Your stack adds the releases toggle.
 */
export const PANE_TAB_KEYS = {
  news: ['open', 'summarize', 'save', 'copy'],
  saved: ['open', 'summarize', 'copy', 'read'],
  stack: ['open', 'summarize', 'save', 'copy', 'releases'],
} as const
