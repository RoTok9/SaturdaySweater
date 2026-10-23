const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
script+="\nmodule.exports.__ui={render,UI,onAction,boot,P,T,serialize,deserialize};";
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
(async()=>{const E=mod.exports,{render,UI,onAction,boot,P,T,serialize,deserialize}=E.__ui;
await boot({});onAction('pick',{dataset:{id:String(+process.argv[2]||16)}});onAction('start',{dataset:{}});const G=E.get();
const HC=['stay','open','run','fire','rest'],QC=['stay','go','clock','prevent','blitz'];let n=0,calls=0;
const playWeek=()=>{onAction('sim',{dataset:{}});if(UI.live&&UI.live.pre){let g=0;while(!UI.live.half&&g++<400){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(it&&it.k==='half')UI.live.half=true;}onAction('halftime',{dataset:{id:HC[n%5]}});g=0;while(UI.live&&UI.live.pre&&!UI.live.pre.decided4&&g++<400){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(!it)break;if(it.k==='call4'){UI.live.q4=true;onAction('fourth',{dataset:{id:QC[(n*7)%5]}});}}g=0;while(UI.live&&UI.live.pre&&UI.live.pre.crunch&&!UI.live.pre.crunchDone&&g++<400){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(!it)break;if(it.k==='crunch'){UI.live.cr=true;onAction('crunch',{dataset:{id:['air','work','fg','prevent','pressure','base'][n%6]}});}}calls++;n++;}
  if(UI.live){const g=G.games.find(x=>x.id===UI.live.gid);if(!g.played)throw new Error('live game not played');const sumH=g.box.plays.filter(p=>p.team===g.home).reduce((a,p)=>a+p.pts,0),sumA=g.box.plays.filter(p=>p.team!==g.home).reduce((a,p)=>a+p.pts,0);if(sumH!==g.hs||sumA!==g.as)throw new Error('box sum mismatch '+sumH+'-'+sumA+' vs '+g.hs+'-'+g.as);if(g.hs===g.as)throw new Error('tie');onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}
  if(G.presser)onAction('press',{dataset:{id:String(n%3)}});if(G.event)onAction('event',{dataset:{id:String(n%2)}});};
for(let s=0;s<3;s++){
  while(G.phase==='season'){playWeek();}
  // invariants
  G.teams.forEach(t=>{const gp=G.games.filter(g=>g.played&&(g.home===t.id||g.away===t.id));const w=gp.filter(g=>g.home===t.id?g.hs>g.as:g.as>g.hs).length;if(w!==t.w||gp.length-w!==t.l)throw new Error(`record mismatch ${t.name} ${t.w}-${t.l} vs ${w}-${gp.length-w}`);});
  Object.values(G.players).forEach(p=>{if(p.st)Object.values(p.st).forEach(v=>{if(typeof v==='number'&&!isFinite(v))throw new Error('NaN stat '+p.n);});if(!isFinite(p.ovr))throw new Error('NaN ovr');});
  const ser=serialize(G);const back=deserialize(ser);if(!back||back.season!==G.season)throw new Error('roundtrip');
  console.log('season',G.season,'user',E.__ui.T(G.user).name,G.teams.find(t=>t.id===G.user).w+'-'+G.teams.find(t=>t.id===G.user).l,'calls',calls,'save bytes',ser.length,'ot games',G.games.filter(g=>g.ot).length);
  onAction('sim',{dataset:{}});if(G.realign)onAction('realign',{dataset:{id:'no'}});if(G.fired&&G.offers.length){onAction('job',{dataset:{id:String(G.offers[0])}});onAction('jobyes',{dataset:{id:String(G.offers[0])}});}onAction('autotrim',{dataset:{}});onAction('sim',{dataset:{}});
}
console.log('INVARIANTS OK');process.exit(0);
})().catch(e=>{console.error(e.stack.split('\n').slice(0,5).join('\n'));process.exit(1);});
