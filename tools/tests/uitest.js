const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach Test',addEventListener(){}};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}}};
const window={scrollTo(){}};
script+="\nmodule.exports.__ui={render,UI,onAction,boot};";
const mod={exports:{}};new Function('module','localStorage','document','window',script)(mod,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},document,window);
const E=mod.exports,{render,UI,onAction,boot}=E.__ui;
(async()=>{
await boot({});console.log('picker len',el.innerHTML.length);
onAction('pick',{dataset:{id:'16'}});onAction('start',{dataset:{}});
const tabs=['home','schedule','recruit','roster','polls','program'];
function all(label){tabs.forEach(t=>{UI.tab=t;render();if(el.innerHTML.length<500)throw new Error('short '+t);});console.log(label,'ok');}
all('season start');
const G=E.get();UI.tab='recruit';const r=G.recruits[0];UI.rOpen=r.id;render();onAction('offer',{dataset:{id:String(r.id)}});onAction('pitchopen',{dataset:{id:String(r.id)}});render();onAction('pitch',{dataset:{id:String(r.id),key:r.wants[0]}});onAction('nil',{dataset:{id:String(r.id),amt:'50'}});onAction('visit',{dataset:{id:String(r.id)}});
onAction('booster',{dataset:{}});onAction('media',{dataset:{}});onAction('adlobby',{dataset:{}});
for(let i=0;i<7;i++){onAction('sim',{dataset:{}});all('week '+(i+2));}
while(G.phase==='season')onAction('sim',{dataset:{}});all('postseason');
onAction('sim',{dataset:{}});all('offseason');UI.showPortal=true;UI.tab='roster';render();
if(G.portal.length){onAction('portal',{dataset:{id:String(G.portal[0].id)}});}
onAction('upgrade',{dataset:{id:'facilities'}});onAction('nilinvest',{dataset:{}});
const u=E.userTeam();onAction('cut',{dataset:{id:String(u.roster[0])}});onAction('cutyes',{dataset:{id:String(u.roster[0])}});
onAction('autotrim',{dataset:{}});onAction('sim',{dataset:{}});all('season 2');
console.log('phase',G.phase,'season',G.season,'user roster',u.roster.length,'nil',G.nil,'budget',G.budget);
onAction('reset',{dataset:{}});onAction('resetyes',{dataset:{}});console.log('reset ok', E.get()===null);

})().catch(e=>{console.error(e);process.exit(1);});
