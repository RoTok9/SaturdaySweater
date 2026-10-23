const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
script+="\nmodule.exports.__ui={dbg:()=>({bakMark,lg:Object.keys(lastGz),gzNext:!!gzNext,gzBusy}),openSlot,importDynasty,serialize,slotKey,getSLOT:()=>SLOT,loadSlots,weeklyShare,render,UI,onAction,boot,addCoach,switchCoach,humanIds,bagOf,T,userTeam};";
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
(async()=>{const E=mod.exports,{render,UI,onAction,boot,addCoach,switchCoach,humanIds,bagOf,T,userTeam}=E.__ui;
await boot({});
onAction('pick',{dataset:{id:'5'}});onAction('start',{dataset:{}});const G0=E.get();
for(let i=0;i<3;i++){await new Promise(r=>setTimeout(r,150));onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}if(E.get().presser)onAction('press',{dataset:{id:'0'}});if(E.get().event)onAction('event',{dataset:{id:'0'}});}
await new Promise(r=>setTimeout(r,300));
const {openSlot,importDynasty,serialize,slotKey,getSLOT,loadSlots}=E.__ui;const id=getSLOT();const key=slotKey(id);
console.log(JSON.stringify(E.__ui.dbg()));console.log('main',(store[key]||'').slice(0,10),'bak',(store[key+':bak']||'').slice(0,10),'week',E.get().week);
store[key]='gz:garbage!!';const ok=await openSlot(id);console.log('restored',ok,'week',E.get().week,'team',E.__ui.userTeam().name);
store[key]='{"teams":[]}';store[key+':bak']='nope';console.log('both bad ->',await openSlot(id));
// import
const data=serialize(E.get());await importDynasty({size:data.length,text:async()=>data});console.log('imported slots',loadSlots().length,'team',E.__ui.userTeam().name,'week',E.get().week);
await importDynasty({size:5,text:async()=>'hello'});console.log('bad import handled');
process.exit(0);})().catch(e=>{console.log('FAIL',e.stack);process.exit(1);});
