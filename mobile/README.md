# Saturday Sweater mobile (iOS and Android)

A Capacitor shell around the same game the website serves. Nothing here needs a Mac.

- `npm run web` copies `site/play/index.html` (built by `ship.sh`) into `www/`.
- `npx cap sync` copies `www/` into the native projects in `ios/` and `android/`.
- App icons and splash screens are already generated from `assets/` (regenerate with `npm run assets`).

## Ship to TestFlight with Codemagic

1. In Codemagic, add the GitHub repo `RoTok9/SaturdaySweater`.
2. Teams > Integrations > App Store Connect: add an API key (App Store Connect > Users and Access > Integrations > Keys, role App Manager). Name the integration `SaturdaySweaterASC`.
3. In App Store Connect, create the app with bundle id `com.saturdaysweater.app`.
4. In Codemagic code signing, let it manage the distribution certificate and profile automatically.
5. Push a tag that starts with `ios-` (for example `ios-1.0.0`). The `ios-testflight` workflow in `codemagic.yaml` builds and uploads to TestFlight.

Android: push an `android-*` tag for a debug APK you can sideload.

Notes: the bundle id, app name and colors are in `capacitor.config.json`. Saves live in the app's own storage, separate from the browser version.
