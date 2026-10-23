# Build and release tools

Everything needed to turn the game source into the web build, the Windows app and the update feed lives here, so the pipeline never depends on a temporary machine.

- `make_fictional.py SRC DST` makes the public copy of the game: fictional schools by default, no real names in the file.
- `build_web.py SRC OUT` makes the browser build (`site/play/index.html`).
- `build_desktop.py` (env `SRC`, `OUT`) makes the Electron app (main.js with the verified updater, preload, local fonts, icons).
- `build_app.py` the older single-file app build.
- `ship.sh VERSION "notes"` does a full release: stamps the version, embeds the changelog, builds web + desktop, writes `version.json` with a SHA-256 of the desktop game file, updates the site's What's new, commits and pushes.

The game source with real school names (`gridiron-dynasty.html`) is kept out of this public repo on purpose.

## Tests (`tests/`)

Node harnesses load the game file directly and play it headless:

- `uitest.js`, `rt.js`, `test60.js`, `invariants.js` single-player flows, rendering of every tab, season-over-season invariants
- `coop_test.js`, `h2h.js`, `coop_monkey.js` pass-and-play, head-to-head calls, random-action fuzzing with three coaches
- `monkey.js` random-action fuzzing
- `save_test.js`, `nfs_test.js` save backups, damaged-save recovery, import, phone save mirror
- `compat.js OLD.html NEW.html` loads a save made by an old build in a new build and plays two seasons (run against old `app/index.html` versions from git history)
- `online_*.js` online leagues against the mock server (`cd server && node mock.mjs 8787`): join races, kicks, coaches changing jobs
- `pw/bmonkey*.js` Playwright fuzzers in a real browser (desktop and phone sizes)

Server tests: `cd server && npm test`.
