import type { RenderSurface } from 'claude-code'

/**
 * Whether one of the attached surfaces draws panes: the terminal or the desktop app.
 *
 * @param surfaces the surfaces attached to the session
 */
export function hasDrawingSurface(surfaces: readonly RenderSurface[]): boolean {
  return surfaces.some(surface => surface === 'terminal' || surface === 'desktop')
}
