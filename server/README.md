# Saturday Sweater league server

A tiny Cloudflare Worker (free tier) that holds online leagues: the shared save, each coach's pending week, ready flags and a version counter. The game client runs the sim; the last coach to ready up merges everyone's week and uploads the new save.

## Deploy (one time, about five minutes)

1. Create a free Cloudflare account at https://dash.cloudflare.com/sign-up
2. In this folder: `npm install` then `npx wrangler login` (opens a browser, click Allow)
3. `npx wrangler deploy`
4. Copy the printed URL (looks like `https://saturday-sweater-league.<your-subdomain>.workers.dev`) into the game: Program tab, Online leagues, Server URL. Or set it as the default in `gridiron-dynasty.html` (`ONLINE_URL`).

## API

- `POST /leagues` `{name, coach:{tid,name}, base, meta}` -> `{id, token, version}`
- `GET /leagues/:id?deltas=1&base=1` -> league state
- `POST /leagues/:id/join` `{tid, name}` -> `{token, version, coaches}`
- `POST /leagues/:id/ready` `{tid, token, version, delta, ready}` -> `{allReady, version, coaches}`
- `POST /leagues/:id/advance` `{tid, token, version, base, meta}` -> `{version}` (409 if stale or not all ready)
- `POST /leagues/:id/kick` commissioner only
