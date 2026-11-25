# Fixtures

Upstream (TheSportsDB) payloads shared by the unit tests, the fixture server and the e2e suite.
Tests never call the live API.

## `upstream/`

| File | Source | What it covers |
|---|---|---|
| `all_leagues.live.json` | real capture | the 10 leagues of the free key, all Soccer |
| `all_leagues.mixed.json` | synthetic | the live 10 plus 4387 NBA (Basketball) and 4370 Formula 1 (Motorsport), for the sport filter |
| `seasons/4328.json`, `4330`–`4337` | real captures | seasons with badges; several seasons may share one badge |
| `seasons/4329.json` | real capture | seasons whose badges are all `null` |
| `seasons/4338.json` | synthetic | all-`null` badges, as observed for 4338 (see below) |
| `seasons/4387.json` | synthetic | NBA seasons, two seasons sharing a badge |
| `seasons/4370.json` | synthetic | Formula 1, single-year seasons (`1950`) |
| `seasons-unknown-id.json` | synthetic | `{"seasons":null}`, the answer for an unknown id |
| `seasons-invalid-id.json` | synthetic | the error string sent with HTTP 200 for a non-numeric id |
| `rate-limited.txt` | real capture | the plain-text Cloudflare body sent with HTTP 429 |

Real captures were taken once on 2026-11-25 with the free key `123`, sequentially, and
pretty-printed. The rate limit blocked the capture after ten requests, so the synthetic files
reproduce responses recorded in [`docs/api.md`](../../docs/api.md) instead of being captured;
their badge file names are made up.

`{{FIXTURE_ORIGIN}}` stands for the image host (`https://r2.thesportsdb.com` upstream). Whoever
loads a fixture replaces it with the origin that serves the fixture images.
