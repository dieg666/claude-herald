/**
 * What a `/news` subcommand answers: its text, whether the refresh timer must restart at the stored interval, whether the band's rotation must restart at the stored seconds, whether the summaries of the items shown must be brought to the current language, and whether the items the pane opened on need their summaries.
 */
export type CommandReply = {
  readonly text: string
  readonly restartRefresh?: boolean
  readonly restartRotation?: boolean
  readonly resyncSummaries?: boolean
  readonly summarizePane?: boolean
}
