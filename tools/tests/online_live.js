const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1]+"\nmodule.exports.__ui={render,UI,onAction,boot,NETget:()=>NET,onlineCreate,onlineLookup,onlineJoin,onlineRefresh,onlineReady,onlinePoll,humanIds,T,userTeam,switchCoach,commitsOf,bagOf,coachDelta,serialize};";
function mk(){const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
 const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
 const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
 const E=mod.exports;E.el=el;E.store=store;E.ls={getItem:k=>store[k]||null};return E;}
(async()=>{
const A=mk(),B=mk();for(const E of [A,B]){E.store['gridiron-server']='http://localhost:8787';await E.__ui.boot({});}
A.__ui.onAction('pick',{dataset:{id:'16'}});
const code=await A.__ui.onlineCreate('Live League',16,'Coach A');await B.__ui.onlineJoin(code,40,'Coach B');await A.__ui.onlineRefresh();
const liveFor=(E,k1,k2)=>{const UI=E.__ui.UI,G=E.get();E.__ui.onAction('sim',{dataset:{}});if(!(UI.live&&UI.live.pre))return null;let g=0;while(!UI.live.half&&g++<300){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(it&&it.k==='half')UI.live.half=true;}E.__ui.onAction('halftime',{dataset:{id:k1}});g=0;while(UI.live&&UI.live.pre&&!UI.live.pre.decided4&&g++<300){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(!it)break;if(it.k==='call4'){UI.live.q4=true;E.__ui.onAction('fourth',{dataset:{id:k2}});}}g=0;while(UI.live&&UI.live.pre&&UI.live.pre.crunch&&!UI.live.pre.crunchDone&&g++<400){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(!it)break;if(it.k==='crunch'){UI.live.cr=true;E.__ui.onAction('crunch',{dataset:{id:'air'}});}}const gm=G.games.find(x=>x.id===UI.live.gid);const f={gid:gm.id,hs:gm._forced.hs,as:gm._forced.as};E.__ui.onAction('liveskip',{dataset:{}});E.__ui.onAction('livedone',{dataset:{}});return f;};
for(let w=1;w<=4;w++){
  const fa=liveFor(A,'open','go'),fb=liveFor(B,'run','stay');
  await A.__ui.onlineReady(true);await B.__ui.onlineReady(true);await A.__ui.onlinePoll();
  const chk=(E,f,n)=>{if(!f)return 'bye';const g=E.get().games.find(x=>x.id===f.gid);if(!g.played)throw new Error(n+' not played');if(g.hs!==f.hs||g.as!==f.as)throw new Error(n+' forced mismatch '+g.hs+'-'+g.as+' vs '+f.hs+'-'+f.as);return `${g.hs}-${g.as} call ${g._call}/${g._call4} by ${g._callBy}`;};
  console.log(`wk${w} A:`,chk(A,fa,'A'),'| B:',chk(B,fb,'B'),'| cross A-view of B game:',fb?chk(A,fb,'A-view'):'bye','| weeks',A.get().week,B.get().week,'pendingLive A',!!A.__ui.UI.pendingLive,'B',!!B.__ui.UI.pendingLive);
  if(A.get().week!==B.get().week)throw new Error('desync');
  const ga=A.get().games.filter(g=>g.played).map(g=>g.hs+'-'+g.as).join(',');const gb=B.get().games.filter(g=>g.played).map(g=>g.hs+'-'+g.as).join(',');if(ga!==gb)throw new Error('game desync');
  [A,B].forEach(E=>{const G=E.get();if(G.presser)E.__ui.onAction('press',{dataset:{id:'0'}});if(G.event)E.__ui.onAction('event',{dataset:{id:'0'}});});
}
console.log('OK');process.exit(0);
})().catch(e=>{console.error(e.stack.split('\n').slice(0,5).join('\n'));process.exit(1);});
