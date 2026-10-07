/** RFC 822 zone names, uppercase, to their offsets from UTC in minutes. */
export const ZONE_OFFSETS: ReadonlyMap<string, number> = new Map([
  ['UT', 0],
  ['UTC', 0],
  ['GMT', 0],
  ['Z', 0],
  ['EST', -300],
  ['EDT', -240],
  ['CST', -360],
  ['CDT', -300],
  ['MST', -420],
  ['MDT', -360],
  ['PST', -480],
  ['PDT', -420],
])
