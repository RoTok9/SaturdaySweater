# Saturday Sweater: CFB Dynasty

College football dynasty manager. You run the program, not the plays.

- **Play in browser:** https://saturdaysweater.com/play/
- **Windows download:** https://github.com/RoTok9/SaturdaySweater/releases/latest

## Layout
- `app/index.html` is the game, and the file the Windows app downloads when it checks for updates.
- `version.json` carries the current version and release notes for the updater.
- `site/` is the website (GitHub Pages). `site/play/index.html` is the browser build.
- `desktop/` is the Electron shell for the Windows app.
- `.github/workflows/windows.yml` builds `SaturdaySweater-Windows.zip` and publishes a release whenever the game or the shell changes. `site.yml` deploys the site.

## Shipping an update
1. Replace `app/index.html` and `site/play/index.html` with the new builds (the `app-version` meta tag inside `app/index.html` must carry the new number).
2. Set the same version in `version.json`.
3. Commit to `main`. The site redeploys, a Windows release is published, and installed apps pick it up on their next update check.
