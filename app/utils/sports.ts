// Relative, not `#shared`: `nuxt.config.ts` imports this file, and its tsconfig has no Nuxt aliases.
import type { League } from '../../shared/types/league'

interface SportOption {
  sport: string
  count: number
}

/** Iconify names (local collections). Listed in the icon client bundle by `nuxt.config.ts`. */
export const SPORT_ICONS: Readonly<Record<string, string>> = {
  Soccer: 'tabler:ball-football',
  Basketball: 'tabler:ball-basketball',
  Motorsport: 'tabler:flag',
}
export const GENERIC_SPORT_ICON = 'tabler:trophy'

/** The sports present in the data, alphabetical, each with its number of leagues. */
export function toSportOptions(leagues: readonly League[]): SportOption[] {
  // Not `Object.groupBy`: this also runs in the browser (hydration), and Safari before 17.4 lacks it.
  const counts = leagues.reduce<Record<string, number>>(
    (count, { sport }) => ({ ...count, [sport]: (count[sport] ?? 0) + 1 }),
    {},
  )
  return Object.entries(counts)
    .map(([sport, count]) => ({ sport, count }))
    .sort((a, b) => a.sport.localeCompare(b.sport, 'en'))
}

export function sportIcon(sport: string): string {
  return SPORT_ICONS[sport] ?? GENERIC_SPORT_ICON
}
