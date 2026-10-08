/**
 * What a `/herald` subcommand answers: its text, whether the refresh timer must restart at the stored interval, whether the band's rotation must restart at the stored seconds, whether the summaries of the items shown must be brought to the current language, whether the items the pane opened on need their summaries, whether the stack's releases must be refreshed, and whether the stack must be detected again first.
 */
export type CommandReply = {
  readonly text: string
  readonly restartRefresh?: boolean
  readonly restartRotation?: boolean
  readonly resyncSummaries?: boolean
  readonly summarizePane?: boolean
  readonly refreshStack?: boolean
  readonly rescanStack?: boolean
}
