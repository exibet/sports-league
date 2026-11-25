// The server → client contract (docs/api.md, "Our contract"). One definition for both sides;
// upstream field names never leave the server adapter.

/** A league in the list. Ids are numeric strings, as upstream sends them. */
export interface League {
  id: string
  name: string
  sport: string
}

/** `GET /api/leagues`. */
export interface LeagueList {
  leagues: League[]
  /** When the list was fetched from upstream (ms since epoch), for the footer freshness line. */
  fetchedAt: number
}

/** One season's badge. Seasons without a badge are dropped on the server. */
export interface SeasonBadge {
  /** As upstream formats it: `1992-1993`, or a single year such as `1950`. */
  season: string
  badgeUrl: string
}

/** One league in detail, for the league page. */
export interface LeagueDetails {
  id: string
  name: string
  sport: string
  country: string
  formedYear: string
  currentSeason: string
  /** With a scheme; `null` when upstream has none. */
  website: string | null
  /** The current logo (`/small`), unlike the archive season badges. */
  logoUrl: string | null
  /** The first paragraph, as plain text. */
  description: string
}

/** `GET /api/leagues/:id`. */
export interface LeagueDetailsResponse {
  details: LeagueDetails
  seasons: SeasonBadge[]
}
