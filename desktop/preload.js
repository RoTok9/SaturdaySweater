const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
  exportSave:json=>ipcRenderer.invoke('export-save',json),
  importSave:()=>ipcRenderer.invoke('import-save'),
  checkUpdate:()=>ipcRenderer.invoke('check-update'),
  onMenu:cb=>ipcRenderer.on('menu',(e,cmd)=>cb(cmd))
});
