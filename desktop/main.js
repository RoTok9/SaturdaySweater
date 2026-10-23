const {app,BrowserWindow,Menu,dialog,ipcMain,shell}=require('electron');
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
