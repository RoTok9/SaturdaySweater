# Store listing: Saturday Sweater

Everything to paste into App Store Connect and the Google Play Console. Character counts are checked against each store's limit.

## Shared

- **Bundle / package id:** `com.saturdaysweater.app`
- **Support URL:** https://saturdaysweater.com/
- **Marketing URL:** https://saturdaysweater.com/
- **Privacy Policy URL:** https://saturdaysweater.com/privacy.html
- **Terms (EULA):** Apple's standard EULA plus https://saturdaysweater.com/terms.html
- **Price:** Free. No in-app purchases yet.
- **Primary category:** Sports. **Secondary:** Simulation.
- **Contact email:** privacy@saturdaysweater.com (once forwarding is set up)

## App Store (Apple)

**Name** (30 max): `Saturday Sweater: CFB Dynasty` (29)

**Subtitle** (30 max): `College football dynasty sim` (28)

**Promotional text** (170 max, can change any time without review):
`Run a college football program and sweat every Saturday. Recruit, survive the press, make the call at halftime and chase a 12-team playoff. Free, with friends or solo.` (167)

**Keywords** (100 max, comma separated, no spaces):
`college,football,dynasty,coach,recruiting,manager,sports,sim,playoff,gm,rivalry,offline,coop` (92)

**Description** (4000 max):

```
You run the program, not the plays.

Saturday Sweater is a college football dynasty manager where every week has stakes. Take over a blue blood or a small school nobody believes in, build it on the recruiting trail, and make the calls that decide Saturdays.

MAKE THE CALL
Watch your games live and decide what happens at halftime, in the fourth quarter and in crunch time: open it up, shorten the game, go for it, ice the kicker. Your coordinators weigh in. The broadcast tells the story.

WIN THE RECRUITING WAR
Call, text, pitch and host campus visits. Every recruit has a personality, a decision day and real odds next to his name. On decision day he reaches for a hat, live. Rival staffs push back, and five-stars can flip.

SURVIVE THE PODIUM
After every game the press is waiting. Your answers move the fans, the locker room, the media and an athletic director with a mandate and a hot seat.

CHASE THE PLAYOFF
A living Top 25, weekly committee rankings, conference races with real clinching scenarios, bowl invitations and a 12-team bracket. Trap games, upsets and rivalries you have to earn over years of big matchups.

BUILD A DYNASTY
Depth charts, breakouts and injuries. The transfer portal and NIL. Draft night, coaching carousels, program traditions, a season archive and a legacy that follows you from job to job.

PLAY WITH FRIENDS
Pass the phone for co-op on one device, or start an online league where everyone runs their own program. Make side bets when you meet head to head.

WEEKLY GAUNTLET
Same school, same league, same recruits for everyone each week. Play one season, get scored, share your result and see who sweated it best.

Schools, players and coaches are fictional. Customize every school's name, nickname and colors with the league editor.

Saturday Sweater is an independent game and is not affiliated with the NCAA, any conference or any school.
```

**What's New** (first release): `First release. Run your program, sweat every Saturday.`

**Screenshots** (in `store/app-store/`, upload in this order):
- iPhone 6.9" (1320 x 2868): `iphone-1-live` through `iphone-6-roster`
- iPad 13" (2064 x 2752): `ipad-1-live` through `ipad-6-roster`

**Age rating questionnaire, how to answer honestly:**
- Most categories are None: violence, sexual content, profanity, horror, gambling and contests (no real-money gambling).
- **Alcohol, tobacco or drug use or references: Infrequent/Mild.** A midweek event mentions a player cited after a bar fight, and tailgates are part of the atmosphere.
- **Simulated gambling: None.** Vegas lines and side bets are flavor, with no wagering of real or virtual currency.
- **Unrestricted web access: No.**
- **User-generated content:** online leagues let coaches type names and short notes visible to their league. Answer Yes to messaging/UGC if the form asks, since notes are visible to other league members.
- Apple will compute the rating from these answers. Expect a low rating, 9+ or 13+.

**App Privacy (nutrition label), first release without ads:**
- **Data collected:** "User Content: Other User Content" (coach and league names and notes in online leagues), used for App Functionality, not linked to identity, not used for tracking.
- Nothing else is collected: no identifiers, usage data, diagnostics or contact info.
- When rewarded ads are turned on, this must be updated: Identifiers (Device ID), Usage Data (Advertising Data), Diagnostics, used for Third-Party Advertising, with Tracking = Yes if personalized ads are allowed. Also add the App Tracking Transparency prompt text.

**Export compliance:** the app uses only standard HTTPS encryption, which qualifies for the exemption. Answer "Yes, uses encryption" and then "only exempt encryption (HTTPS)". `ITSAppUsesNonExemptEncryption = NO` can also go in Info.plist.

## Google Play

**App name** (30 max): `Saturday Sweater: CFB Dynasty` (29)

**Short description** (80 max): `Run a college football program. Recruit, make the calls, chase the playoff.` (75)

**Full description** (4000 max): same as the App Store description.

**Graphics** (in `store/google-play/`):
- Feature graphic 1024 x 500: `feature-graphic-1024x500.png`
- Phone screenshots 1080 x 2160: `phone-1-live` through `phone-6-roster`
- App icon 512 x 512: export from `mobile/assets/icon.png`

**Data safety form, first release without ads:**
- Collects "Other in-app messages / user-generated content" for online leagues (optional, app functionality, not shared, encrypted in transit, deletable by leaving the league).
- No data shared with third parties until ads are on.

**Content rating:** fill out the IARC questionnaire with the same answers as Apple's.
