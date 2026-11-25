# Requirements

The assignment as received, verbatim (line breaks and typos kept), followed by the interpretation
this project works from. Interpretation lives in its own section so the verbatim text stays
untouched.

## Assignment

> Build a single-page application (SPA) that consumes the All Leagues API and displays
> the sports leagues with filtering options.
>
> - Fetch and display a list of sports leagues.
> - Display Fields:
>   - strLeague
>   - strSport
> - Add a search bar to filter leagues by name.
> - Add a dropdown to filter by sport type if multiple sport types appear in the response (e.g.,
>   Soccer, Basketball, Motorsport).
> - Use component-based architecture.
> - The UI should be responsive and functional as a priority, visual enhancements can be
>   added if time allows
>
> The league entities respond to clicks and call the Season Badge API with the league ID to
> display a season badge image (can be for any season you like or the first entity in the
> response).
>
> - Responses should be cached to avoid repeat callstrDescriptionEN
>
> **Tech Stack**
>
> The solution is expected to be based on:
>
> - Vue, React or Angular
> - Other tools/libraries can be used at your discretion.
>
> **API**
>
> All Leagues:
> https://www.thesportsdb.com/api/v1/json/123/all_leagues.php
>
> Badge Lookup:
> https://www.thesportsdb.com/api/v1/json/123/search_all_seasons.php?badge=1&id=<id
> >
>
> Documentation: https://www.thesportsdb.com/free_sports_api
>
> **Design**
>
> Design decisions are entirely at your discretion.
>
> **Delivery**
>
> - Submit a link to a public GitHub repo.
> - The project must be 100% runnable.
> - Include concise .md notes on AI tools and design decisions.

## Context

> The goal of this assignment is to evaluate your skills in frontend development,
> especially your proficiency with components based, state management and API
> integration. The project simulates a simplified component from an online bookmaker
> platform.
>
> You are free to use any AI tools to assist you with this task - including for UI/UX
> design, icon creation, layout generation, or even code scaffolding. If you do use any
> tools, please include a short .md file describing which ones you used and how they
> helped. The focus of this assignment is on your understanding of product logic and
> implementation - not whether everything is handcrafted from scratch.
>
> The task is expected to take approximately 90 minutes. If you're unable to complete
> all requirements within that time, please provide additional context or explanations in
> the .md file.

Additional context from the candidate: the hiring company is moving to Nuxt.

## Requirement checklist

| ID | Requirement | Source |
|---|---|---|
| R1 | Fetch and display the list of leagues | Assignment |
| R2 | Show `strLeague` and `strSport` for each league | Assignment |
| R3 | Search bar filters leagues by name | Assignment |
| R4 | Sport dropdown that filters when the response has more than one sport | Assignment |
| R5 | Component-based architecture | Assignment |
| R6 | Responsive and functional first, visual polish second | Assignment |
| R7 | Clicking a league calls the Season Badge API with its ID and shows a season badge (any season, or the first one) | Assignment |
| R8 | Responses are cached, no repeat calls | Assignment |
| R9 | Vue, React or Angular; other libraries allowed | Assignment |
| R10 | Public GitHub repository | Delivery |
| R11 | 100% runnable | Delivery |
| R12 | Concise `.md` notes on AI tools and design decisions | Delivery + Context |
| R13 | Explain in the `.md` anything not finished within ~90 minutes | Context |
| E1 | Evaluated: components, state management, API integration, product logic | Context |

## Interpretation notes

- **"callstrDescriptionEN" (R8).** Looks like a copy-paste join of "repeat calls" and the field
  name `strDescriptionEN`. That field is not in `all_leagues.php`; it comes from
  `lookupleague.php?id=`. We read it as a hint that the league description may be shown, and we
  show it on the league page (see `decisions.md`).
- **"SPA" vs Nuxt with server rendering.** We build a Nuxt universal app: the first request is
  server-rendered, every navigation after hydration is client-side, so the result behaves as an
  SPA. This is a deliberate choice (SEO for league pages, server cache, hidden API key), recorded
  in `decisions.md`. A strict client-only build would mean `ssr: false` plus moving the upstream
  calls out of the server layer; not planned.
- **"if multiple sport types appear" (R4).** The free key returns 10 leagues, all Soccer. The
  dropdown is always shown, filled from the data, so the control is discoverable; with one sport
  it is disabled with a note ("Only Soccer leagues in the data"), since there is nothing to
  filter. The filtering is proven by unit and e2e tests on fixtures with several sports; the README opens with a screenshot of the dropdown and the command
  `npm run dev:fixtures`, which runs the app on mixed-sport fixtures (`decisions.md`, D1).
- **"any season or the first entity" (R7).** We show the first season with a badge by default and
  let the user switch seasons.
- **90 minutes.** The scope is larger than 90 minutes (server layer, league page, tests). The core
  brief (R1–R8) is built first and every extra phase is cuttable.
