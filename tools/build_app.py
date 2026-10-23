import re, os, json, shutil, glob
from PIL import Image, ImageDraw, ImageFont

SRC='/home/claude/gridiron-dynasty.html'
OUT='/home/claude/gridiron-dynasty-app'
s=open(SRC).read()

def rep(old,new,count=1):
    global s
    assert s.count(old)==count,(old[:70],s.count(old))
    s=s.replace(old,new)

# ---------- 1. fictional defaults baked into TEAMS, academics keyed by index ----------
teams_block=s[s.index('const TEAMS=['):s.index('];',s.index('const TEAMS=['))+2]
rows=re.findall(r"\['((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)','(\w+)',(\d+),'(#[0-9A-Fa-f]{6})','(\w+)'\]",teams_block)
assert len(rows)==136,len(rows)
fict_block=s[s.index('const FICTIONAL=['):s.index('];',s.index('const FICTIONAL=['))+2]
fict=re.findall(r"\['((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)'\]",fict_block)
assert len(fict)==136
acad_block=s[s.index('const ACADEMIC={'):s.index('};',s.index('const ACADEMIC={'))+2]
acad=dict(re.findall(r"'([^']+)':(\d+)",acad_block))
acad_idx=[int(acad.get(r[0].replace("\\'","'"),5)) for r in rows]
new_rows=[]
for i,r in enumerate(rows):
    new_rows.append("['%s','%s','%s',%s,'%s','%s']"%(fict[i][0],fict[i][1],r[2],r[3],r[4],r[5]))
new_teams='const TEAMS=[\n'+',\n'.join(new_rows)+'\n];'
s=s.replace(teams_block,new_teams)
s=s.replace(acad_block,'const ACADEMIC_IDX='+json.dumps(acad_idx)+';')
rep("case 'academics':return ACADEMIC[team.name]||5;","case 'academics':return ACADEMIC_IDX[team.id]||5;")
rep("""<button class="btn sm ghost" data-act="leaguepreset" data-id="fictional">Load fictional league</button><button class="btn sm ghost" data-act="leaguepreset" data-id="original">Restore original names</button>""",
    """<button class="btn sm ghost" data-act="leaguepreset" data-id="original">Reset to default league</button>""")
rep("Rename any school, change its nickname or colors, load the fictional league, or paste in a league a friend shared.",
    "Rename any school, change its nickname or colors, or paste in a league a friend shared.")

# ---------- 2. native save, haptics, status bar ----------
rep("function save(){try{localStorage.setItem(KEY,JSON.stringify(G));}catch(e){}}",
"""const Plug=n=>(window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins[n])||null;
let saveT=null;
function save(){if(!G)return;const json=JSON.stringify(G);try{localStorage.setItem(KEY,json);}catch(e){}const P=Plug('Preferences');if(P){clearTimeout(saveT);saveT=setTimeout(()=>P.set({key:KEY,value:json}).catch(()=>{}),300);}}
async function loadAsync(){const P=Plug('Preferences');if(P){try{const r=await P.get({key:KEY});if(r&&r.value){G=JSON.parse(r.value);migrate();return true;}}catch(e){}}return load();}
function haptic(kind){const H=Plug('Haptics');if(!H)return;try{H.impact({style:kind==='heavy'?'HEAVY':kind==='medium'?'MEDIUM':'LIGHT'}).catch(()=>{});}catch(e){}}""")
rep("function saveLeague(){try{localStorage.setItem(LEAGUE_KEY,JSON.stringify(LEAGUE));}catch(e){}}",
    "function saveLeague(){const json=JSON.stringify(LEAGUE);try{localStorage.setItem(LEAGUE_KEY,json);}catch(e){}const P=Plug('Preferences');if(P)P.set({key:LEAGUE_KEY,value:json}).catch(()=>{});}")
rep("function loadLeague(){try{const s=localStorage.getItem(LEAGUE_KEY);",
    "function parseLeague(s){if(!s)return;")
# parseLeague body: original used 'if(s){...}' then catch; adapt
rep("""if(s){const arr=JSON.parse(s);if(Array.isArray(arr)&&arr.length===TEAMS.length)LEAGUE=arr.map((x,i)=>({name:String(x.name||TEAMS[i][0]).slice(0,28),nick:String(x.nick||TEAMS[i][1]).slice(0,24),conf:CONFS[x.conf]?x.conf:TEAMS[i][2],color:/^#[0-9a-fA-F]{6}$/.test(x.color||'')?x.color:TEAMS[i][4]}));}}catch(e){}}""",
"""try{const arr=JSON.parse(s);if(Array.isArray(arr)&&arr.length===TEAMS.length)LEAGUE=arr.map((x,i)=>({name:String(x.name||TEAMS[i][0]).slice(0,28),nick:String(x.nick||TEAMS[i][1]).slice(0,24),conf:CONFS[x.conf]?x.conf:TEAMS[i][2],color:/^#[0-9a-fA-F]{6}$/.test(x.color||'')?x.color:TEAMS[i][4]}));}catch(e){}}
async function loadLeague(){const P=Plug('Preferences');if(P){try{const r=await P.get({key:LEAGUE_KEY});if(r&&r.value){parseLeague(r.value);return;}}catch(e){}}try{parseLeague(localStorage.getItem(LEAGUE_KEY));}catch(e){}}""")
rep("function boot(data){loadLeague();","async function boot(data){await loadLeague();")
rep("  if(data&&data.G){G=data.G;migrate();if(data.UI)Object.assign(UI,data.UI);}else load();",
    "  if(data&&data.G){G=data.G;migrate();if(data.UI)Object.assign(UI,data.UI);}else await loadAsync();")
rep("case 'resetyes':G=null;UI.confirm=null;UI.pickTeam=null;try{localStorage.removeItem(KEY);}catch(e){}break;",
    "case 'resetyes':G=null;UI.confirm=null;UI.pickTeam=null;try{localStorage.removeItem(KEY);}catch(e){}{const P=Plug('Preferences');if(P)P.remove({key:KEY}).catch(()=>{});}break;")
# haptics in live feed
rep("function liveTick(){const L=UI.live;if(!L||L.done)return;if(L.shown<L.feed.length){L.shown++;const item=L.feed[L.shown-1];render();",
    "function liveTick(){const L=UI.live;if(!L||L.done)return;if(L.shown<L.feed.length){L.shown++;const item=L.feed[L.shown-1];if(item.k==='s')haptic(item.team===G.user?'medium':'light');if(item.k==='end')haptic('heavy');render();")
# status bar style follows header color
rep("document.documentElement.style.setProperty('--team-fg',luminance(col)>0.4?'#111111':'#ffffff');}",
    "document.documentElement.style.setProperty('--team-fg',luminance(col)>0.4?'#111111':'#ffffff');const S=Plug('StatusBar');if(S){try{S.setStyle({style:luminance(col)>0.4?'LIGHT':'DARK'}).catch(()=>{});}catch(e){}}}")
# boot call: no artifact hot hooks
rep("""if(typeof window!=='undefined'&&app){
  window.claude?.hot?.snapshot?.(()=>({G,UI}));
  window.claude?.hot?.ready?window.claude.hot.ready(boot):boot(window.claude?.hot?.data??{});
}""","""if(typeof window!=='undefined'&&app){boot({});}""")

# ---------- 3. standalone document shell, offline fonts ----------
rep('<meta name="claude:viewport-fit-sides" content="cover">\n','')
rep('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600&display=swap">\n','')
fontcss="""
@font-face{font-family:"Barlow";font-weight:400;font-display:swap;src:url(fonts/barlow-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow";font-weight:500;font-display:swap;src:url(fonts/barlow-latin-500-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow";font-weight:600;font-display:swap;src:url(fonts/barlow-latin-600-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow Condensed";font-weight:600;font-display:swap;src:url(fonts/barlow-condensed-latin-600-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow Condensed";font-weight:700;font-display:swap;src:url(fonts/barlow-condensed-latin-700-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow Condensed";font-weight:800;font-display:swap;src:url(fonts/barlow-condensed-latin-800-normal.woff2) format("woff2")}
/* native shell: respect notch/home bar, no rubber-band, no text selection outside inputs */
html{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);background:var(--team);overscroll-behavior:none;-webkit-text-size-adjust:100%}
body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
input,textarea{-webkit-user-select:text;user-select:text}
img{max-width:100%}[hidden]{display:none!important}
"""
rep('<style>\n','<style>'+fontcss)
head='''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=no">
'''
s=head+s.replace('<div id="app"></div>','</head>\n<body>\n<div id="app"></div>',1)+'\n</body>\n</html>\n'

# ---------- 4. write project ----------
if os.path.exists(OUT):shutil.rmtree(OUT)
os.makedirs(OUT+'/www/fonts');os.makedirs(OUT+'/assets')
open(OUT+'/www/index.html','w').write(s)
FD=''+__import__('os').path.dirname(__import__('os').path.abspath(__file__))+'/fonts'
for f in glob.glob(FD+'/*/package/files/*latin-*-normal.woff2'):
    b=os.path.basename(f)
    if re.search(r'barlow-latin-(400|500|600)-normal|barlow-condensed-latin-(600|700|800)-normal',b):
        shutil.copy(f,OUT+'/www/fonts/'+b)
json.dump({
 "name":"gridiron-dynasty","version":"1.0.0","private":True,"description":"College football dynasty manager",
 "scripts":{"sync":"cap sync","ios":"cap open ios","assets":"capacitor-assets generate --ios --iconBackgroundColor '#0f3d2e' --splashBackgroundColor '#0f3d2e'"},
 "dependencies":{"@capacitor/core":"^6.1.0","@capacitor/ios":"^6.1.0","@capacitor/preferences":"^6.0.0","@capacitor/haptics":"^6.0.0","@capacitor/status-bar":"^6.0.0","@capacitor/app":"^6.0.0"},
 "devDependencies":{"@capacitor/cli":"^6.1.0","@capacitor/assets":"^3.0.5"}
},open(OUT+'/package.json','w'),indent=2)
json.dump({
 "appId":"com.yourname.gridirondynasty","appName":"Gridiron Dynasty","webDir":"www","bundledWebRuntime":False,
 "backgroundColor":"#0f3d2e",
 "ios":{"contentInset":"never","backgroundColor":"#0f3d2e","scrollEnabled":True,"allowsLinkPreview":False},
 "plugins":{"SplashScreen":{"launchShowDuration":800,"backgroundColor":"#0f3d2e","launchAutoHide":True}}
},open(OUT+'/capacitor.config.json','w'),indent=2)
open(OUT+'/.gitignore','w').write("node_modules/\nios/App/Pods/\nios/App/build/\nios/App/App.xcworkspace/xcuserdata/\n.DS_Store\n")

# icon + splash
def icon(size):
    im=Image.new('RGB',(size,size),'#0f3d2e');d=ImageDraw.Draw(im)
    # field stripes
    for i in range(0,size,size//10):
        d.rectangle([0,i,size,i+size//20],fill='#124634')
    for x in range(size//10,size,size//10):
        d.line([(x,0),(x,size)],fill='#1f5a45',width=max(2,size//200))
    # football
    cx,cy=size//2,size//2;rw,rh=int(size*0.36),int(size*0.22)
    ball=Image.new('RGBA',(size,size),(0,0,0,0));bd=ImageDraw.Draw(ball)
    bd.ellipse([cx-rw,cy-rh,cx+rw,cy+rh],fill='#8a4b24',outline='#f3ecd8',width=max(4,size//90))
    ball=ball.rotate(-30,resample=Image.BICUBIC,center=(cx,cy));im.paste(ball,(0,0),ball)
    # laces
    lace=Image.new('RGBA',(size,size),(0,0,0,0));ld=ImageDraw.Draw(lace)
    w=max(6,size//70);ld.line([(cx-int(size*0.11),cy),(cx+int(size*0.11),cy)],fill='#f3ecd8',width=w)
    for k in range(-2,3):
        x=cx+k*int(size*0.05);ld.line([(x,cy-int(size*0.035)),(x,cy+int(size*0.035))],fill='#f3ecd8',width=w)
    lace=lace.rotate(-30,resample=Image.BICUBIC,center=(cx,cy));im.paste(lace,(0,0),lace)
    return im
icon(1024).save(OUT+'/assets/icon.png')
sp=Image.new('RGB',(2732,2732),'#0f3d2e');sp.paste(icon(900),(916,916));sp.save(OUT+'/assets/splash.png')

open(OUT+'/PRIVACY.md','w').write("""# Gridiron Dynasty Privacy Policy

Gridiron Dynasty does not collect, transmit or share any personal data.

All game progress is stored only on your device. The app does not use analytics, advertising, accounts or network services. Deleting the app deletes its data.

Contact: your@email.com
""")
open(OUT+'/README.md','w').write(r"""# Gridiron Dynasty (iOS build)

Single-file web game wrapped with Capacitor. Everything runs on-device; no servers.

## What's different from the web version
- Fictional schools by default (the League Editor lets players rename everything).
- Saves go through Capacitor Preferences (durable native storage) with localStorage as a fallback.
- Haptics on scoring plays in the live game, status bar styled to the team color, fonts bundled for offline use.

## Build it (Mac with Xcode installed)
1. `npm install`
2. Edit `capacitor.config.json`: set `appId` to your reverse-domain bundle id (e.g. `com.yourname.gridirondynasty`). It must match what you register in App Store Connect.
3. `npx cap add ios`
4. `npm run assets` (generates the icon and splash sets from `assets/`)
5. `npx cap sync`
6. `npx cap open ios`, then in Xcode: select the App target, Signing & Capabilities, pick your Team. Plug in your iPhone, choose it as the run destination, press Run.

Every time you change `www/index.html`, run `npx cap sync` and Run again.

## Ship it
1. Join the Apple Developer Program ($99/year) at developer.apple.com.
2. In App Store Connect, create the app with the same bundle id. Name: Gridiron Dynasty (or your own). Category: Games / Sports.
3. In Xcode: Product > Archive, then Distribute App > App Store Connect > Upload.
4. TestFlight tab: add yourself and a few friends as testers; play a full season on real phones first.
5. App Store tab: screenshots (6.7" and 6.5" iPhone sizes are required; take them from the Simulator or your phone), description, keywords, support URL, privacy policy URL (host `PRIVACY.md` anywhere, e.g. a GitHub Pages page).
6. App Privacy questionnaire: answer "Data Not Collected".
7. Age rating questionnaire: all "None"; expect 4+.
8. Submit for review. In the review notes say: "Offline single-player sports management game. All content is fictional and generated in-app; no accounts or network access required."

## Review tips
- Guideline 4.2 (minimum functionality): the app must not feel like a website. It doesn't, but keep the shell native: no external links, no browser chrome, works in airplane mode. Test airplane mode before submitting.
- Guideline 5.2 (intellectual property): ship with fictional schools (already the default). Don't put real school names, logos or marks in screenshots or the store listing.
- Keep the first-launch experience clear: pick a school, pick a coach name, play.

## Later
- Android: `npm i @capacitor/android && npx cap add android`; the same `www` works.
- iCloud save sync or export/import of saves: the save is one JSON string under key `gridiron-dynasty-save-v1`, so a share-sheet export is a small addition.
""")
print('wrote',OUT)
