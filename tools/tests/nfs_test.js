const files={};global.__cap={isNativePlatform:()=>true,Plugins:{Filesystem:{writeFile:async o=>{files[o.path]=o.data;},readFile:async o=>{if(!(o.path in files))throw new Error('nf');return {data:files[o.path]};},deleteFile:async o=>{delete files[o.path];}}}};
const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){},Capacitor:global.__cap};
script+="\nmodule.exports.__ui={dbg:()=>({bakMark,lg:Object.keys(lastGz),gzNext:!!gzNext,gzBusy}),openSlot,importDynasty,serialize,slotKey,getSLOT:()=>SLOT,loadSlots,weeklyShare,render,UI,onAction,boot,addCoach,switchCoach,humanIds,bagOf,T,userTeam};";
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
(async()=>{const E=mod.exports;const {render,UI,onAction,boot}=E.__ui;await boot({});
onAction('pick',{dataset:{id:'5'}});onAction('start',{dataset:{}});
for(let i=0;i<2;i++){await new Promise(r=>setTimeout(r,200));onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}}
await new Promise(r=>setTimeout(r,500));console.log('files',Object.keys(files).join(','),'week',E.get().week);
const wk=E.get().week;Object.keys(store).forEach(k=>delete store[k]);
// fresh app instance with empty web storage, same device files
const mod2={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod2,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
await mod2.exports.__ui.boot({});const G2=mod2.exports.get();console.log('restored after wipe:',!!G2,G2&&G2.week,'expected',wk);
process.exit(G2&&G2.week===wk?0:1);})().catch(e=>{console.log('FAIL',e.stack);process.exit(1);});
