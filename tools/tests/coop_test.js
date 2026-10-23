const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null};const window={scrollTo(){}};
script+="\nmodule.exports.__ui={render,UI,onAction,boot,addCoach,switchCoach,humanIds,simWeek,runOffseason,startNextSeason,serialize,deserialize,bagOf,T,userTeam,commitsOf};";
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
(async()=>{const E=mod.exports,{render,UI,onAction,boot,addCoach,switchCoach,humanIds,simWeek,runOffseason,startNextSeason,serialize,deserialize,bagOf,T,userTeam,commitsOf}=E.__ui;
await boot({});onAction('pick',{dataset:{id:'16'}});onAction('start',{dataset:{}});const G=E.get();
const A=16,B=40,C=90;console.log('add',addCoach(B,'Coach B'),addCoach(C,'Coach C'),'humans',humanIds().map(h=>T(h).name).join(','));
const play=(tid)=>{switchCoach(tid);let n=0;G.recruits.forEach(r=>{if(n<15&&r.stars>=3&&!r.offer){onAction('offer',{dataset:{id:String(r.id)}});n++;}});onAction('callall',{dataset:{}});if(G.presser)onAction('press',{dataset:{id:'0'}});if(G.event)onAction('event',{dataset:{id:'0'}});
  for(const t of ['home','recruit','roster','polls','program','schedule']){UI.tab=t;render();if(t==='home'&&!el.innerHTML.includes('Pass and play</div>'))throw new Error('no league table');if(!el.innerHTML.includes(userTeam().name))throw new Error('render '+t+' for '+tid);}};
for(let s=0;s<3;s++){
  while(G.phase==='season'){[A,B,C].forEach(play);switchCoach(A);simWeek();
    if(G.week===3){const hA=bagOf(A).hours??G.hours,hB=bagOf(B).hours,hC=bagOf(C).hours;console.log('wk3 hours',G.hours,hB,hC,'news A/B/C',G.news.length,bagOf(B).news.length,bagOf(C).news.length,'offers A/B/C',G.recruits.filter(r=>r.offer).length,G.recruits.filter(r=>r.h&&r.h[B]&&r.h[B].offer).length,G.recruits.filter(r=>r.h&&r.h[C]&&r.h[C].offer).length);}}
  console.log(G.season,[A,B,C].map(h=>`${T(h).name} ${T(h).w}-${T(h).l} rk${T(h).rank} commits ${commitsOf(h)} seat ${bagOf(h).coach.seat} goals ${(bagOf(h).goals||{list:[]}).list.map(g=>g.final).join('/')}`).join(' | '));
  runOffseason();humanIds().slice().forEach(h=>{switchCoach(h);if(G.realign)onAction('realign',{dataset:{id:'no'}});if(G.fired){onAction('job',{dataset:{id:String(G.offers[0])}});onAction('jobyes',{dataset:{id:String(G.offers[0])}});}onAction('spring',{dataset:{}});onAction('autotrim',{dataset:{}});UI.tab='home';render();if(!el.innerHTML.includes('Offseason calendar'))throw new Error('offseason render');});
  console.log('   offseason budgets',[A,B,C].map(h=>bagOf(h).budget).join('/'),'draft mine',[A,B,C].map(h=>(bagOf(h).draft||{mine:[]}).mine.length).join('/'),'spring',[A,B,C].map(h=>!!bagOf(h).spring).join('/'));
  switchCoach(A);startNextSeason();if(G.phase!=='season'){console.log('blocked:',humanIds().map(h=>T(h).name+' roster '+T(h).roster.length+' fired '+bagOf(h).fired+' realign '+JSON.stringify(bagOf(h).realign)+' offers '+JSON.stringify(bagOf(h).offers)).join(' ; '));throw new Error('did not start');}
  // round trip save
  const str=serialize(G);const g2=deserialize(str);if(!g2.h||Object.keys(g2.h).length<2)throw new Error('h lost');
}
console.log('humans after 3 seasons',humanIds().map(h=>T(h).name+' coach '+bagOf(h).coach.name+' yrs '+bagOf(h).coach.years).join(', '));
console.log('OK');
})().catch(e=>{console.error(e.stack.split('\n').slice(0,9).join('\n'));process.exit(1);});
