# TheSportsDB API — what it really returns

Verified against the live API with the free key `123` on 2026-11-25. Everything below is observed
behaviour, not the documentation.

Base URL: `https://www.thesportsdb.com/api/v1/json/{key}/` · docs: https://www.thesportsdb.com/free_sports_api

## Transport

- **CORS is open:** `access-control-allow-origin: *`.
- `all_leagues.php` sends `cache-control: public, max-age=14400` (4 hours).
- **Rate limit.** About ten rapid requests in a row get answered by Cloudflare with a plain-text
  body `error code: 1015`. The body is not JSON. The server layer must detect it, return a clear
  error and never cache it. How long the block lasts was not measured; assume minutes.
- Images (badges, logos) are served from `https://r2.thesportsdb.com/images/media/...`, a separate
  CDN host that is not affected by the API rate limit. Appending `/small` or `/tiny` to an image
  URL returns a smaller variant (one badge: 48 KB full, 20 KB `/small`, 11 KB `/tiny`); we use
  `/small`.

## Endpoints we use

### `all_leagues.php` — list of leagues

```json
{
  "leagues": [
    { "idLeague": "4328", "strLeague": "English Premier League", "strSport": "Soccer" },
    { "idLeague": "4329", "strLeague": "English League Championship", "strSport": "Soccer" }
  ]
}
```

- The free key returns **10 leagues, all `Soccer`**: 4328, 4329, 4330, 4331, 4332, 4334, 4335,
  4336, 4337, 4338.
- Only three fields; every value is a string, `idLeague` included. `strLeagueAlternate` from the
  docs is not returned.

### `search_all_seasons.php?badge=1&id={id}` — season badges

```json
{
  "seasons": [
    { "strSeason": "1992-1993", "strBadge": "https://r2.thesportsdb.com/images/media/league/badgearchive/02egea1661959225.png" },
    { "strSeason": "1993-1994", "strBadge": "https://r2.thesportsdb.com/images/media/league/badgearchive/d9hqy61661959233.png" }
  ]
}
```

- The free key returns the **5 oldest seasons**, oldest first (EPL: 1992-1993 … 1996-1997).
- Season format is `"1992-1993"` or a single year (`"1950"` for Formula 1, `"1960"` for NFL).
- Several seasons often share the same badge image.

Edge cases:

| Request | Response |
|---|---|
| Seasons exist, no badges (4329 Championship, 4338 Belgian Pro League) | `{"seasons":[{"strSeason":"1892-1893","strBadge":null}, …]}` |
| Unknown id (`999999`) | `{"seasons":null}` |
| Invalid id (`abc`) | **HTTP 200** with `{"seasons":"Invalid League ID passed"}`: an error string where an array is expected |

Real type:

```ts
type SeasonsResponse = {
  seasons: Array<{ strSeason: string, strBadge: string | null }> | null | string
}
```

### `lookupleague.php?id={id}` — league details (league page only)

Unknown id (`999999`) → `{"leagues":null}` → our route answers 404.

47 fields. The ones we use:

| Field | Example (4328) | Notes |
|---|---|---|
| `strLeague` | English Premier League | |
| `strSport` | Soccer | |
| `strLeagueAlternate` | Premier League, EPL, England | comma-separated; could feed search later |
| `strCountry` | England | `Worldwide` for Formula 1 |
| `intFormedYear` | 1992 | string |
| `strCurrentSeason` | 2026-2027 | `2026` for Formula 1 |
| `strWebsite` | www.premierleague.com | no scheme; sometimes with a path |
| `strBadge` | https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png | the **current** logo, unlike the archive season badges |
| `strDescriptionEN` | The Premier League, often referred to as … | long; first paragraph is enough |

Also present: `strLogo`, `strTrophy`, `strBanner`, `strFanart1-4`, descriptions in 15 other
languages, social links.

**Description quirks.** Pronunciation IPA has been stripped upstream, leaving fragments such as
`(Italian pronunciation: )` and `(Dutch pronunciation: ; "Honour Division" …)`. The server cleans
these with a small regex and keeps the first paragraph.

## Other free endpoints (checked, not used)

| Endpoint | Free key returns |
|---|---|
| `all_sports.php` | 2 sports (Soccer, Motorsport) with icons |
| `all_countries.php` | 50 countries, Andorra … Costa Rica; England, Spain, Italy missing |
| `search_all_leagues.php?c=England&s=Soccer` | 5 leagues (EFL Cup, Isthmian …) |
| `search_all_teams.php?l=…` | 10 teams |
| `eventsnextleague.php` / `eventspastleague.php` | 1 event each |
| `lookuptable.php` | top 5 rows |

Every list is truncated on the free key, which rules out country grouping with flags (no flags
for the countries we need) and match lists.

## Our contract (server → client)

```ts
// shared/types — one definition for server and client
export interface League { id: string, name: string, sport: string }
export interface SeasonBadge { season: string, badgeUrl: string } // seasons with null badges dropped
export interface LeagueDetails {
  id: string, name: string, sport: string, country: string, formedYear: string,
  currentSeason: string, website: string | null, logoUrl: string | null, description: string
}
```

| Route | Returns | Upstream |
|---|---|---|
| `GET /api/leagues` | `{ leagues: League[], fetchedAt: number }` | `all_leagues.php` |
| `GET /api/leagues/:id/seasons` | `SeasonBadge[]` | `search_all_seasons.php` |
| `GET /api/leagues/:id` | `{ details: LeagueDetails, seasons: SeasonBadge[] }` | `lookupleague.php` + `search_all_seasons.php` in parallel |

Errors:

- non-numeric `:id` → 400; an id not in the cached league list → 404 (no per-league upstream
  call in either case; validation may load the cached league list);
- `seasons: null`, the error string or all-null badges → `[]`; `leagues: null` → 404;
- upstream timeout, 429, `1015` or non-JSON → 502 with a readable message, not cached. These are
  detected **before** normalisation, so an error is never turned into a cached `[]`.

Upstream calls use `retry: 0` and a timeout.

## Real data used in the prototype and fixtures

Leagues 4328–4338 above, plus two non-soccer leagues fetched by id for the mixed-sports fixture:
4387 NBA (Basketball, seasons 1960-1961 … 1964-1965) and 4370 Formula 1 (Motorsport, 1950 … 1954).
