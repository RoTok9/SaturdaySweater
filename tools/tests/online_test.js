const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1]+"\nmodule.exports.__ui={render,UI,onAction,boot,NETget:()=>NET,onlineCreate,onlineLookup,onlineJoin,onlineRefresh,onlineReady,onlinePoll,humanIds,T,userTeam,switchCoach,commitsOf,bagOf,coachDelta,serialize};";
function mk(){const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
 const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
 const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
 const E=mod.exports;E.el=el;E.store=store;E.ls={getItem:k=>store[k]||null};return E;}
(async()=>{
const A=mk(),B=mk();for(const E of [A,B]){E.store['gridiron-server']='http://localhost:8787';await E.__ui.boot({});}
A.__ui.onAction('pick',{dataset:{id:'16'}});
const code=await A.__ui.onlineCreate('Test League',16,'Coach A');console.log('created',code,'A week',A.get().week);
const st=await B.__ui.onlineLookup(code);console.log('lookup coaches',st.coaches.map(c=>c.name).join(','),'open?',!st.coaches.some(c=>c.tid===40));
await B.__ui.onlineJoin(code,40,'Coach B');const GB=B.get();console.log('B joined: user',B.__ui.userTeam().name,'humans',B.__ui.humanIds().join(','),'version',B.__ui.NETget().version);
await A.__ui.onlineRefresh();const GA=A.get();console.log('A after refresh: humans',A.__ui.humanIds().join(','),'coaches',A.__ui.NETget().coaches.map(c=>c.name+(c.ready?'*':'')).join(','),'user',A.__ui.userTeam().name);
const play=(E,n)=>{const G=E.get();let k=0;G.recruits.forEach(r=>{if(k<n&&r.stars>=3&&!r.offer){E.__ui.onAction('offer',{dataset:{id:String(r.id)}});k++;}});E.__ui.onAction('callall',{dataset:{}});if(G.presser)E.__ui.onAction('press',{dataset:{id:'0'}});if(G.event)E.__ui.onAction('event',{dataset:{id:'0'}});};
for(let w=1;w<=4;w++){
  play(A,12);play(B,10);const offA=A.get().recruits.filter(r=>r.offer).length,offB=B.get().recruits.filter(r=>r.offer).length;
  await A.__ui.onlineReady(true);console.log(`wk${w} A ready; coaches`,A.__ui.NETget().coaches.map(c=>c.name+(c.ready?'*':'')).join(','),'label',A.el.innerHTML.includes('Waiting on 1')?'waiting-on-1':'?');
  await B.__ui.onlineReady(true);  // B is last -> advances
  console.log(`   B advanced: B week`,B.get().week,'version',B.__ui.NETget().version,'B user',B.__ui.userTeam().name,'B offers',B.get().recruits.filter(r=>r.offer).length,'(was',offB,')','hours',B.get().hours);
  await A.__ui.onlinePoll();console.log(`   A polled: week`,A.get().week,'version',A.__ui.NETget().version,'A user',A.__ui.userTeam().name,'A offers',A.get().recruits.filter(r=>r.offer).length,'(was',offA,')','pendingLive',!!A.__ui.UI.pendingLive,'A record',A.__ui.userTeam().w+'-'+A.__ui.userTeam().l,'B rec per A',A.__ui.T(40).w+'-'+A.__ui.T(40).l);
  if(A.get().week!==B.get().week)throw new Error('desync');
  const ga=A.get().games.filter(g=>g.played).map(g=>g.hs+'-'+g.as).join(',');const gb=B.get().games.filter(g=>g.played).map(g=>g.hs+'-'+g.as).join(',');if(ga!==gb)throw new Error('game desync');
}
// run to end of season quickly: both ready each week
let guard=0;while(A.get().phase==='season'&&guard++<30){play(A,0);play(B,0);await A.__ui.onlineReady(true);await B.__ui.onlineReady(true);await A.__ui.onlinePoll();}
console.log('phase',A.get().phase,B.get().phase,'season',A.get().season);
await A.__ui.onlineReady(true);await B.__ui.onlineReady(true);await A.__ui.onlinePoll();console.log('after offseason step: phase',A.get().phase,B.get().phase,'budget A',A.get().budget,'B',B.get().budget,'portal',A.get().portal.length);
// B takes a portal player and realign no; A autotrims
B.__ui.onAction('autotrim',{dataset:{}});A.__ui.onAction('autotrim',{dataset:{}});const pp=B.get().portal[0];if(pp){B.get().nil=99999;B.__ui.onAction('portal',{dataset:{id:String(pp.id)}});console.log('B took',pp.n,'roster has',B.__ui.userTeam().roster.includes(pp.id));}
if(A.get().realign)A.__ui.onAction('realign',{dataset:{id:'no'}});if(B.get().realign)B.__ui.onAction('realign',{dataset:{id:'no'}});
await A.__ui.onlineReady(true);await B.__ui.onlineReady(true);await A.__ui.onlinePoll();
console.log('next season: phase',A.get().phase,B.get().phase,'season',A.get().season,B.get().season,'B portal player on roster (A view)',pp?A.__ui.T(40).roster.includes(pp.id):'n/a','(B view)',pp?B.__ui.userTeam().roster.includes(pp.id):'n/a','humans A',A.__ui.humanIds().join(','),'B',B.__ui.humanIds().join(','));
console.log('OK');process.exit(0);
})().catch(e=>{console.error(e.stack.split('\n').slice(0,4).join('\n'));process.exit(1);});
