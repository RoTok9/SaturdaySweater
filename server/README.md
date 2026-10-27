# Saturday Sweater league server

A tiny Cloudflare Worker (free tier) that holds online leagues: the shared save, each coach's pending week, ready flags and a version counter. The game client runs the sim; the last coach to ready up merges everyone's week and uploads the new save.

## Deploy from GitHub (no terminal)

1. Create a free Cloudflare account and open Workers & Pages once so it sets up your workers.dev subdomain.
2. Create an API token with the "Edit Cloudflare Workers" template, and copy your Account ID.
3. In the GitHub repo: Settings > Secrets and variables > Actions, add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. Actions tab > "deploy league server" > Run workflow. It runs the server tests, deploys, and checks `/health`. Later changes under `server/` deploy on their own.

## Deploy (from a terminal, about five minutes)

1. Create a free Cloudflare account at https://dash.cloudflare.com/sign-up
2. In this folder: `npm install` then `npx wrangler login` (opens a browser, click Allow)
3. `npx wrangler deploy`
4. Copy the printed URL (looks like `https://saturday-sweater-league.<your-subdomain>.workers.dev`) into the game: Program tab, Online leagues, Server URL. Or set it as the default in `gridiron-dynasty.html` (`ONLINE_URL_DEFAULT`).

## How it stays solid

- One Durable Object per league, and each league handles one request at a time, so two coaches readying or advancing at the same moment can never overwrite each other. When two coaches try to advance the same week, exactly one wins; the other gets `409 stale` and refreshes.
- The save is written in chunks under a new version prefix, then a single atomic write flips the pointer. A crash mid-upload leaves the previous save intact; a reader can never see half of one save and half of another.
- Each coach's pending week is stored under its own key, so a full 12-coach league stays well under storage value limits.
- Joining, leaving and removing coaches keep everyone else's pending week and ready flag.
- A coach who takes a new job keeps their seat: the server moves them to their new team id when the week advances.
- All input is validated (team ids, sizes, names). Errors always come back as JSON with CORS headers.
- Leagues untouched for 180 days delete themselves (Durable Object alarm), so storage stays inside the free tier.

## Tests

- `node test/stress.mjs` validation, auth, concurrent joins/readies/advances, kick/leave/job moves, crash safety
- `node test/stress.mjs --chaos` the same with random storage latency and injected write failures
- `node mock.mjs 8787 [--latency=ms] [--fail=0.05]` local stand-in server for running the game's online tests

## API

- `GET /health` -> `{ok, v}`
- `POST /leagues` `{name, coach:{tid,name}, base, meta}` -> `{id, token, version}`
- `GET /leagues/:id[?deltas=1][&base=1][&since=version]` -> league state (`unchanged:true` when `since` matches)
- `POST /leagues/:id/join` `{tid, name}` -> `{token, version, coaches}` (the new coach is pending until they register)
- `POST /leagues/:id/register` `{tid, token, version, base, meta}` -> uploads the save with the new coach's team added
- `POST /leagues/:id/ready` `{tid, token, version, delta, ready, tidNow?}` -> `{allReady, version, coaches}`
- `POST /leagues/:id/advance` `{tid, token, version, base, meta, force?}` -> `{version, moved}` (409 if stale or not all ready; only the commissioner may force)
- `POST /leagues/:id/kick` `{tid, token, target}` commissioner only
- `POST /leagues/:id/leave` `{tid, token}` the commissioner role passes to the longest-tenured coach; the last coach out deletes the league
