# Sports Leagues

A Nuxt 4 app that lists sports leagues from [TheSportsDB](https://www.thesportsdb.com/), with
search, a sport filter, each league's season badges in an accordion and a server-rendered league
page. Requests to TheSportsDB go through the app's own server layer, which keeps the API key on the
server and caches the responses.

![The league list with the sport filter open on mixed-sport fixtures](docs/readme/sport-filter.png)

The free TheSportsDB key returns only Soccer leagues, so on live data the sport filter is shown
but disabled. To try it with several sports, run the app on the bundled fixtures:

```bash
npm install
npm run dev:fixtures   # http://localhost:3000, mixed sports and edge cases
```

## How to run

Requires Node `^22.22.3 || ^24.15.0` (see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:3000
```

The defaults work without configuration; `.env.example` lists the optional server settings.

## Documentation

Requirements, decisions, API notes, design and the implementation plan are in [`docs/`](./docs/).
