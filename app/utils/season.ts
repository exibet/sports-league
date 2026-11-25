const TWO_YEARS = /^(\d{4})-(\d{2})(\d{2})$/

/** `1992-1993` → `1992/93`; a single year (`1950`) or anything unexpected is kept as it is. */
export function shortSeason(season: string): string {
  const match = TWO_YEARS.exec(season)
  return match ? `${match[1]}/${match[3]}` : season
}
