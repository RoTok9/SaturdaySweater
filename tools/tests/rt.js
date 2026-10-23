const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'C',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null};const window={scrollTo(){}};
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script+"\nmodule.exports.__ui={render,UI,onAction,boot,serialize,deserialize};")(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
const E=mod.exports,{render,UI,onAction,boot,serialize,deserialize}=E.__ui;
(async()=>{
await boot({});onAction('pick',{dataset:{id:'16'}});onAction('start',{dataset:{}});let G=E.get();
while(G.phase==='season'){onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}if(G.presser)onAction('press',{dataset:{id:'0'}});if(G.event)onAction('event',{dataset:{id:'0'}});}
onAction('sim',{dataset:{}});const ser=serialize(G);console.log('serialized bytes',ser.length,'vs plain',JSON.stringify(G).length);
// reload mid-offseason, add a portal player, check canonical
await boot({});G=E.get();const u=E.userTeam();const pp=G.portal[0];const before=u.roster.length;onAction('portal',{dataset:{id:String(pp.id)}});console.log('portal add ok',u.roster.length===before+1,'canonical team',G.players[pp.id].team===u.id,'same object',G.players[pp.id]===u.roster.map(id=>G.players[id]).find(p=>p.id===pp.id));
onAction('autotrim',{dataset:{}});onAction('sim',{dataset:{}});for(let i=0;i<3;i++){onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}if(G.presser)onAction('press',{dataset:{id:'0'}});if(G.event)onAction('event',{dataset:{id:'0'}});}
const stale=Object.values(G.players).filter(p=>p.team===-1&&!G.portal.includes(p)).length;console.log('stale team=-1 players',stale);
['home','schedule','recruit','roster','polls','program'].forEach(t=>{UI.tab=t;render();});console.log('tabs ok after reload');

})().catch(e=>{console.error(e);process.exit(1);});
