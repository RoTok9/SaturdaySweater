// Copies the built web game (site/play) into www/ for Capacitor.
const fs=require('fs'),path=require('path');
const src=path.join(__dirname,'..','..','site','play');const out=path.join(__dirname,'..','www');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(src,'index.html'),'utf8');
// native shells do not need the service worker
html=html.replace(/<script>if\("serviceWorker" in navigator\)[\s\S]*?<\/script>/,'');
fs.writeFileSync(path.join(out,'index.html'),html);
for(const f of ['manifest.json']){const p=path.join(src,f);if(fs.existsSync(p))fs.copyFileSync(p,path.join(out,f));}
const icon=path.join(__dirname,'..','..','site','icon.png');if(fs.existsSync(icon))fs.copyFileSync(icon,path.join(out,'icon.png'));
console.log('www ready:',fs.readdirSync(out).join(', '));
