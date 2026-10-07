/**
 * What a `/news` subcommand answers: its text, and whether the refresh timer must restart at the stored interval.
 */
export type CommandReply = {
  readonly text: string
  readonly restartRefresh?: boolean
}
