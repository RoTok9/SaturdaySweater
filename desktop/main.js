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
  win.webContents.on('did-fail-load',(e,code,desc,url)=>log('did-fail-load '+code+' '+desc+' '+url));
  win.webContents.on('did-finish-load',()=>log('did-finish-load'));
  win.webContents.on('render-process-gone',(e,d)=>log('render-process-gone '+JSON.stringify(d)));
  win.webContents.on('preload-error',(e,p,err)=>log('preload-error '+p+' '+err));
  win.webContents.on('console-message',(e,level,msg,line,src)=>log('console['+level+'] '+msg+' ('+src+':'+line+')'));
  win.loadFile(path.join(__dirname,'app','index.html')).then(()=>log('loadFile resolved')).catch(err=>log('loadFile rejected '+err));
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
const APP_HTML=path.join(__dirname,'app','index.html');
function localVersion(){try{const m=fs.readFileSync(APP_HTML,'utf8').match(/name="app-version" content="([^"]+)"/);return m?m[1]:'0';}catch(e){return '0';}}
function newer(a,b){const pa=a.split('.').map(Number),pb=b.split('.').map(Number);for(let i=0;i<3;i++){if((pa[i]||0)>(pb[i]||0))return true;if((pa[i]||0)<(pb[i]||0))return false;}return false;}
ipcMain.handle('check-update',async()=>{
  try{const r=await fetch(UPDATE_BASE+'version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const info=await r.json();const cur=localVersion();
    if(!newer(String(info.version),cur))return {status:'current',version:cur};
    const h=await fetch(UPDATE_BASE+'app/index.html?t='+Date.now(),{cache:'no-store'});if(!h.ok)throw new Error('HTTP '+h.status);const html=await h.text();
    if(!html.includes('name="app-version"'))throw new Error('bad download');
    fs.writeFileSync(APP_HTML+'.new',html,'utf8');fs.renameSync(APP_HTML+'.new',APP_HTML);
    return {status:'updated',version:String(info.version),notes:info.notes||''};}
  catch(e){return {status:'error',error:String(e.message||e)};}
});
ipcMain.handle('export-save',async(e,json)=>{const r=await dialog.showSaveDialog(win,{title:'Export dynasty save',defaultPath:'gridiron-dynasty-save.json',filters:[{name:'Save files',extensions:['json']}]});if(r.canceled||!r.filePath)return false;fs.writeFileSync(r.filePath,json,'utf8');return true;});
ipcMain.handle('import-save',async()=>{const r=await dialog.showOpenDialog(win,{title:'Import dynasty save',filters:[{name:'Save files',extensions:['json']}],properties:['openFile']});if(r.canceled||!r.filePaths.length)return null;return fs.readFileSync(r.filePaths[0],'utf8');});
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
