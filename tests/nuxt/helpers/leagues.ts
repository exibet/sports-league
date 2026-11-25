import type { League } from '#shared/types/league'

/** The mixed fixture list in our own shape: 10 Soccer, 1 Basketball, 1 Motorsport. */
export const LEAGUES: League[] = [
  { id: '4328', name: 'English Premier League', sport: 'Soccer' },
  { id: '4329', name: 'English League Championship', sport: 'Soccer' },
  { id: '4330', name: 'Scottish Premier League', sport: 'Soccer' },
  { id: '4331', name: 'German Bundesliga', sport: 'Soccer' },
  { id: '4332', name: 'Italian Serie A', sport: 'Soccer' },
  { id: '4334', name: 'French Ligue 1', sport: 'Soccer' },
  { id: '4335', name: 'Spanish La Liga', sport: 'Soccer' },
  { id: '4336', name: 'Greek Super League 1', sport: 'Soccer' },
  { id: '4337', name: 'Dutch Eredivisie', sport: 'Soccer' },
  { id: '4338', name: 'Belgian Pro League', sport: 'Soccer' },
  { id: '4387', name: 'NBA', sport: 'Basketball' },
  { id: '4370', name: 'Formula 1', sport: 'Motorsport' },
]

export const SOCCER_ONLY = LEAGUES.filter(league => league.sport === 'Soccer')
