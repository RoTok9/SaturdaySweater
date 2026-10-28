import re, os, json, shutil, glob
from PIL import Image, ImageDraw

SRC=os.environ.get('SRC','/home/claude/gridiron-dynasty.html')
OUT=os.environ.get('OUT','/home/claude/gridiron-dynasty-desktop')
s=open(SRC).read()
def rep(old,new,count=1):
    global s
    assert s.count(old)==count,(old[:70],s.count(old))
    s=s.replace(old,new)

# ---------- feedback: sounds, flash, rumble, keyboard ----------
# fx toggle + save export/import in Program > Save card
rep("""<button class="btn sm ghost" data-act="theme">Theme: ${({dark:'Stadium night',light:'Daylight',auto:'Match device'})[themePref()]||'Stadium night'}</button></div>""",
"""<button class="btn sm ghost" data-act="theme">Theme: ${({dark:'Stadium night',light:'Daylight',auto:'Match device'})[themePref()]||'Stadium night'}</button>${window.desktop?`<button class="btn sm ghost" data-act="exportsave">Export save</button><button class="btn sm ghost" data-act="importsave">Import save</button>`:''}${window.desktop&&window.desktop.checkUpdate?`<button class="btn sm" data-act="checkupdate" ${UI.updating?'disabled':''}>${UI.updating?'Checking...':'Check for updates'}</button>`:''}</div>
    ${UI.updateMsg?`<div class="small ${UI.updateOk?'ok':'muted'}">${esc(UI.updateMsg)}</div>`:''}
    <div class="tiny muted">Version ${(document.querySelector('meta[name=app-version]')||{}).content||'?'}</div>
    <div class="tiny muted">Keys: Space or Enter sims the week, S skips a live game, 1-6 switch tabs, F11 fullscreen.</div>""")
rep("    case 'cancel':UI.confirm=null;break;",
"""    case 'cancel':UI.confirm=null;break;
    case 'checkupdate':UI.updating=true;UI.updateMsg='';render();window.desktop.checkUpdate().then(r=>{UI.updating=false;UI.updateOk=r.status==='updated';UI.updateMsg=r.status==='updated'?`Updated to ${r.version}. Reloading...`:r.status==='current'?`You have the latest version (${r.version}).`:`Could not check for updates: ${r.error||'no connection'}.`;render();if(r.status==='updated')setTimeout(()=>location.reload(),1200);}).catch(e=>{UI.updating=false;UI.updateOk=false;UI.updateMsg='Could not check for updates.';render();});return;
    case 'exportsave':if(window.desktop&&G)window.desktop.exportSave(JSON.stringify(G));return;
    case 'importsave':if(window.desktop)window.desktop.importSave().then(txt=>{if(!txt)return;try{const g=JSON.parse(txt);if(!g||!g.teams||!g.players)throw 0;if(G)save();G=g;newSlot();migrate();save();UI.tab='home';render();}catch(e){UI.leagueMsg='';}});return;""")
# keyboard shortcuts
rep("  app.addEventListener('change',e=>{",
"""  document.addEventListener('keydown',e=>{const tag=(e.target&&e.target.tagName)||'';if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;if(!G)return;
    if(e.key===' '||e.key==='Enter'){e.preventDefault();if(UI.live){if(UI.live.done)onAction('livedone',{dataset:{}});else onAction('liveskip',{dataset:{}});}else{const b=app.querySelector('.simbtn:not(:disabled)');if(b)onAction('sim',{dataset:{}});}}
    else if(e.key==='s'||e.key==='S'){if(UI.live&&!UI.live.done)onAction('liveskip',{dataset:{}});}
    else if(/^[1-6]$/.test(e.key)){onAction('tab',{dataset:{id:['home','schedule','recruit','roster','polls','program'][+e.key-1]}});}});
  app.addEventListener('change',e=>{""")
# no artifact hot hooks
rep("""if(typeof window!=='undefined'&&app){
  window.claude?.hot?.snapshot?.(()=>({G,UI,SLOT}));
  window.claude?.hot?.ready?window.claude.hot.ready(boot):boot(window.claude?.hot?.data??{});
}""","""if(typeof window!=='undefined'&&app){boot({});}""")

# ---------- standalone shell, fonts, desktop CSS ----------
rep('<meta name="claude:viewport-fit-sides" content="cover">\n','')
rep('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600&family=Graduate&display=swap">\n','')
css="""
@font-face{font-family:"Barlow";font-weight:400;src:url(fonts/barlow-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow";font-weight:500;src:url(fonts/barlow-latin-500-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow";font-weight:600;src:url(fonts/barlow-latin-600-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow Condensed";font-weight:600;src:url(fonts/barlow-condensed-latin-600-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow Condensed";font-weight:700;src:url(fonts/barlow-condensed-latin-700-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow Condensed";font-weight:800;src:url(fonts/barlow-condensed-latin-800-normal.woff2) format("woff2")}
@font-face{font-family:"Graduate";font-weight:400;src:url(data:font/woff2;base64,GRADUATE_B64) format("woff2")}
html{background:var(--bg);overscroll-behavior:none}
body{-webkit-user-select:none;user-select:none}
input,textarea{-webkit-user-select:text;user-select:text}
img{max-width:100%}[hidden]{display:none!important}
button{cursor:pointer}
main{max-width:900px}
.tabs{max-width:900px}
@media (min-width:720px){ .tabs{max-width:900px} }
::-webkit-scrollbar{width:10px}::-webkit-scrollbar-thumb{background:var(--line);border-radius:5px}
"""
FD=''+__import__('os').path.dirname(__import__('os').path.abspath(__file__))+'/fonts'
import base64 as _b64
css=css.replace('GRADUATE_B64',_b64.b64encode(open(FD+'/fontsource-graduate/package/files/graduate-latin-400-normal.woff2','rb').read()).decode())
rep('<style>\n','<style>'+css)
rep("<script>\n'use strict';","<script>\nwindow.addEventListener('error',function(e){var d=document.getElementById('app')||document.body;d.innerHTML='<pre style=\"color:#fff;background:#300;padding:20px;white-space:pre-wrap;font:14px monospace\">Startup error: '+(e.message||'')+'\\n'+(e.error&&e.error.stack||'')+'</pre>';});\n'use strict';")
head='''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data:; img-src 'self' data:; font-src 'self' data:">
<meta name="app-version" content="1.169.2">
'''
s=head+s.replace('<div id="app"></div>','</head>\n<body>\n<div id="app"></div>',1)+'\n</body>\n</html>\n'

# ---------- project files ----------
if os.path.exists(OUT):shutil.rmtree(OUT)
os.makedirs(OUT+'/app/fonts');os.makedirs(OUT+'/build')
open(OUT+'/app/index.html','w').write(s)
FD=''+__import__('os').path.dirname(__import__('os').path.abspath(__file__))+'/fonts'
for f in glob.glob(FD+'/*/package/files/*latin-*-normal.woff2'):
    b=os.path.basename(f)
    if re.search(r'barlow-latin-(400|500|600)-normal|barlow-condensed-latin-(600|700|800)-normal|graduate-latin-400-normal',b):
        shutil.copy(f,OUT+'/app/fonts/'+b)
open(OUT+'/main.js','w').write(r"""const {app,BrowserWindow,Menu,dialog,ipcMain,shell}=require('electron');
const fs=require('fs');const path=require('path');
app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
let win;
function createWindow(){
  win=new BrowserWindow({width:1100,height:820,minWidth:420,minHeight:600,backgroundColor:'#0f1116',title:'Saturday Sweater',
    icon:path.join(__dirname,'build','icon.png'),autoHideMenuBar:true,
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,spellcheck:false}});
  const logFile=path.join(path.dirname(app.getPath('exe')),'launch.log');
  const log=m=>{try{fs.appendFileSync(logFile,new Date().toISOString()+' '+m+'\n');}catch(e){}};
  log('start electron '+process.versions.electron+' dir '+__dirname);
  win.webContents.on('did-fail-load',(e,code,desc,url)=>{log('did-fail-load '+code+' '+desc+' '+url);if(!forceBundled&&appHtml()===USER_HTML){forceBundled=true;win.loadFile(BUNDLED_HTML);}});
  win.webContents.on('did-finish-load',()=>log('did-finish-load'));
  win.webContents.on('render-process-gone',(e,d)=>log('render-process-gone '+JSON.stringify(d)));
  win.webContents.on('preload-error',(e,p,err)=>log('preload-error '+p+' '+err));
  win.webContents.on('console-message',(e,level,msg,line,src)=>log('console['+level+'] '+msg+' ('+src+':'+line+')'));
  win.loadFile(appHtml()).then(()=>log('loadFile resolved')).catch(err=>log('loadFile rejected '+err));
  win.webContents.setWindowOpenHandler(({url})=>{if(/^https?:/.test(url))shell.openExternal(url);return {action:'deny'};});
  win.webContents.on('will-navigate',e=>e.preventDefault());
}
const menu=Menu.buildFromTemplate([
  {label:'File',submenu:[{label:'Check for updates',click:()=>win&&win.webContents.send('menu','checkupdate')},{type:'separator'},{label:'Export save...',click:()=>win&&win.webContents.send('menu','exportsave')},{label:'Import save...',click:()=>win&&win.webContents.send('menu','importsave')},{type:'separator'},{role:'quit'}]},
  {label:'View',submenu:[{role:'reload'},{role:'togglefullscreen'},{type:'separator'},{role:'zoomIn'},{role:'zoomOut'},{role:'resetZoom'}]},
  {label:'Help',submenu:[{label:'Keys: Space sims, S skips, 1-6 tabs, F11 fullscreen',enabled:false}]}
]);
Menu.setApplicationMenu(menu);
const UPDATE_BASE='https://raw.githubusercontent.com/RoTok9/SaturdaySweater/main/';
// Updates are written to the user's app-data folder (the install folder is read-only once packaged).
// The newest of the bundled copy and the downloaded copy is loaded; a downloaded copy that fails to load falls back to the bundled one.
const BUNDLED_HTML=path.join(__dirname,'app','index.html');
const USER_DIR=path.join(app.getPath('userData'),'app');
const USER_HTML=path.join(USER_DIR,'index.html');
function verOf(f){try{const m=fs.readFileSync(f,'utf8').slice(0,4000).match(/name="app-version" content="([^"]+)"/);return m?m[1]:null;}catch(e){return null;}}
function newer(a,b){const pa=String(a).split('.').map(Number),pb=String(b).split('.').map(Number);for(let i=0;i<3;i++){if((pa[i]||0)>(pb[i]||0))return true;if((pa[i]||0)<(pb[i]||0))return false;}return false;}
let forceBundled=false;
function appHtml(){if(forceBundled)return BUNDLED_HTML;const u=verOf(USER_HTML),b=verOf(BUNDLED_HTML);return u&&(!b||newer(u,b))?USER_HTML:BUNDLED_HTML;}
function localVersion(){return verOf(appHtml())||'0';}
function copyFonts(){try{const src=path.join(__dirname,'app','fonts'),dst=path.join(USER_DIR,'fonts');fs.mkdirSync(dst,{recursive:true});for(const f of fs.readdirSync(src)){const d=path.join(dst,f);if(!fs.existsSync(d))fs.writeFileSync(d,fs.readFileSync(path.join(src,f)));}}catch(e){}}
async function getText(url){let last;for(let i=0;i<3;i++){try{const ac=new AbortController();const t=setTimeout(()=>ac.abort(),45000);const r=await fetch(url+(url.includes('?')?'&':'?')+'t='+Date.now(),{cache:'no-store',signal:ac.signal});clearTimeout(t);if(!r.ok)throw new Error('HTTP '+r.status);return await r.text();}catch(e){last=e;await new Promise(res=>setTimeout(res,1000*(i+1)));}}throw last;}
ipcMain.handle('check-update',async()=>{
  try{const info=JSON.parse(await getText(UPDATE_BASE+'version.json'));const cur=localVersion();
    if(!info||!info.version||!newer(String(info.version),cur))return {status:'current',version:cur};
    const html=await getText(UPDATE_BASE+'app/index.html');
    // verify before installing: right version, complete file, matching checksum when the feed has one
    const m=html.slice(0,4000).match(/name="app-version" content="([^"]+)"/);
    if(!m||!html.trimEnd().endsWith('</html>'))throw new Error('The download was incomplete. Try again in a minute.');
    if(m[1]!==String(info.version))return {status:'error',error:'The update is still publishing. Try again in a few minutes.'};
    if(info.sha256){const h=require('crypto').createHash('sha256').update(html,'utf8').digest('hex');if(h!==info.sha256)throw new Error('The download did not match its checksum. Try again in a minute.');}
    fs.mkdirSync(USER_DIR,{recursive:true});copyFonts();
    if(fs.existsSync(USER_HTML))try{fs.copyFileSync(USER_HTML,USER_HTML+'.prev');}catch(e){}
    fs.writeFileSync(USER_HTML+'.new',html,'utf8');fs.renameSync(USER_HTML+'.new',USER_HTML);forceBundled=false;
    return {status:'updated',version:String(info.version),notes:info.notes||''};}
  catch(e){return {status:'error',error:String(e.message||e)};}
});
ipcMain.handle('export-save',async(e,json)=>{const r=await dialog.showSaveDialog(win,{title:'Export dynasty save',defaultPath:'gridiron-dynasty-save.json',filters:[{name:'Save files',extensions:['json']}]});if(r.canceled||!r.filePath)return false;fs.writeFileSync(r.filePath,json,'utf8');return true;});
ipcMain.handle('import-save',async()=>{const r=await dialog.showOpenDialog(win,{title:'Import dynasty save',filters:[{name:'Save files',extensions:['json']}],properties:['openFile']});if(r.canceled||!r.filePaths.length)return null;return fs.readFileSync(r.filePaths[0],'utf8');});
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
""")
open(OUT+'/preload.js','w').write(r"""const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
  exportSave:json=>ipcRenderer.invoke('export-save',json),
  importSave:()=>ipcRenderer.invoke('import-save'),
  checkUpdate:()=>ipcRenderer.invoke('check-update'),
  onMenu:cb=>ipcRenderer.on('menu',(e,cmd)=>cb(cmd))
});
""")
# menu bridge in renderer: listen for menu commands
s2=open(OUT+'/app/index.html').read()
s2=s2.replace("if(typeof window!=='undefined'&&app){boot({});}","if(typeof window!=='undefined'&&app){boot({});if(window.desktop&&window.desktop.onMenu)window.desktop.onMenu(cmd=>onAction(cmd,{dataset:{}}));if(window.desktop&&window.desktop.checkUpdate)setTimeout(()=>{window.desktop.checkUpdate().then(r=>{if(r&&r.status==='updated'){ripple('Updated to '+r.version+'. Reloading...');renderRipples();setTimeout(()=>location.reload(),1800);}}).catch(()=>{});},2500);}")
open(OUT+'/app/index.html','w').write(s2)
json.dump({
 "name":"saturday-sweater","productName":"Saturday Sweater","version":"1.0.0","description":"College football dynasty manager","main":"main.js","private":True,"author":"You",
 "scripts":{"start":"electron .","dist":"electron-builder","dist:win":"electron-builder --win","dist:mac":"electron-builder --mac","dist:linux":"electron-builder --linux"},
 "devDependencies":{"electron":"^33.2.0","electron-builder":"^25.1.8"},
 "build":{"appId":"com.saturdaysweater.desktop","productName":"Saturday Sweater","directories":{"output":"dist","buildResources":"build"},"files":["main.js","preload.js","app/**/*","build/icon.png"],
   "win":{"target":[{"target":"nsis","arch":["x64"]},{"target":"portable","arch":["x64"]}],"icon":"build/icon.png"},
   "nsis":{"oneClick":False,"allowToChangeInstallationDirectory":True,"createDesktopShortcut":True},
   "mac":{"target":["dmg"],"icon":"build/icon.png","category":"public.app-category.sports-games"},
   "linux":{"target":["AppImage"],"icon":"build/icon.png","category":"Game"}}
},open(OUT+'/package.json','w'),indent=2)
open(OUT+'/.gitignore','w').write("node_modules/\ndist/\n")

# icon: field + football + wordmark
def icon(size):
    im=Image.new('RGB',(size,size),'#0f3d2e');d=ImageDraw.Draw(im)
    for i in range(0,size,size//10):d.rectangle([0,i,size,i+size//20],fill='#124634')
    for x in range(size//10,size,size//10):d.line([(x,0),(x,size)],fill='#1f5a45',width=max(2,size//200))
    cx,cy=size//2,int(size*0.47);rw,rh=int(size*0.36),int(size*0.22)
    ball=Image.new('RGBA',(size,size),(0,0,0,0));bd=ImageDraw.Draw(ball)
    bd.ellipse([cx-rw,cy-rh,cx+rw,cy+rh],fill='#8a4b24',outline='#f3ecd8',width=max(4,size//90))
    ball=ball.rotate(-30,resample=Image.BICUBIC,center=(cx,cy));im.paste(ball,(0,0),ball)
    lace=Image.new('RGBA',(size,size),(0,0,0,0));ld=ImageDraw.Draw(lace);w=max(6,size//70)
    ld.line([(cx-int(size*0.11),cy),(cx+int(size*0.11),cy)],fill='#f3ecd8',width=w)
    for k in range(-2,3):x=cx+k*int(size*0.05);ld.line([(x,cy-int(size*0.035)),(x,cy+int(size*0.035))],fill='#f3ecd8',width=w)
    lace=lace.rotate(-30,resample=Image.BICUBIC,center=(cx,cy));im.paste(lace,(0,0),lace)
    return im
import os
_master=''+__import__('os').path.dirname(__import__('os').path.abspath(__file__))+'/icon-master.png'
if os.path.exists(_master):
    _im=Image.open(_master).convert('RGBA');_im.save(OUT+'/build/icon.png');_im.resize((256,256),Image.LANCZOS).save(OUT+'/build/icon-256.png')
else:
    icon(1024).save(OUT+'/build/icon.png');icon(256).save(OUT+'/build/icon-256.png')
open(OUT+'/README.md','w').write(r"""# Saturday Sweater (desktop)

Electron wrapper around the single-file game. Saves live in your user profile (Electron's app data folder), so they survive updates and reinstalls. Use File > Export save to back one up.

## Play it right now
1. Install Node.js (nodejs.org, LTS) if you don't have it.
2. In this folder: `npm install` (downloads Electron, about 100 MB, once)
3. `npm start`

## Make an installer / desktop icon
- Windows: `npm run dist:win` produces `dist/Saturday Sweater Setup 1.0.0.exe` (installer with a desktop shortcut) and `dist/Saturday Sweater 1.0.0.exe` (portable, no install).
- Mac: `npm run dist:mac` (must be run on a Mac). Linux: `npm run dist:linux`.
Windows SmartScreen will warn once about an unsigned app; choose More info > Run anyway. Code-signing certificates fix that but cost money; not needed for your own machine.

## Updating the game
Replace `app/index.html` with the new build and run `npm start` (or `npm run dist:win` again).

## Controls
Space / Enter: sim the week, or skip and continue a live game. S: skip to the final. 1-6: tabs. F11: fullscreen. Sound and screen effects can be turned off under Program > Save & settings. If a game controller is connected, it rumbles on scoring plays.
""")
print('wrote',OUT)
