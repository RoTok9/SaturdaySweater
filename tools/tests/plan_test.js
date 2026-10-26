// Staff plan: one tap sets the game plan; scouted plans are sharper than blind ones, and neither is perfect.
const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
script+="\nmodule.exports.__ui={render,UI,onAction,boot,userTeam,planEdge,staffPlan};";
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
let fail=0;const bad=m=>{fail++;console.log('BAD',m);};
(async()=>{const E=mod.exports,{render,UI,onAction,boot,userTeam,planEdge,staffPlan}=E.__ui;await boot({});
onAction('pick',{dataset:{id:'20'}});onAction('start',{dataset:{}});const G=E.get();
let n=0,sd={blind:0,sc:0,def:0,best:0};
for(let i=0;i<13&&G.phase==='season';i++){const g=G.games.find(x=>x.week===G.week&&!x.played&&(x.home===G.user||x.away===G.user));
 if(g){const keep=Object.assign({},G.plan);const ev=p=>{G.plan=Object.assign({},keep,p);const v=planEdge(g).edge;return v;};
  const def=ev({off:'balanced',def:'base',agg:'standard',prac:'none'});let best=-1e9;for(const off of ['ground','balanced','air'])for(const d of ['base','stack','cover','blitz'])for(const agg of ['conservative','standard','aggressive'])for(const prac of ['none','redzone','passrush','conditioning'])best=Math.max(best,ev({off,def:d,agg,prac}));
  G.plan=keep;const b1=staffPlan(g);const blind=ev(b1);g.scouted=true;G.plan=keep;const b2=staffPlan(g);const sc=ev(b2);G.plan=keep;
  const b3=staffPlan(g);if(JSON.stringify(b2)!==JSON.stringify(b3))bad('not stable between taps');
  sd.def+=def;sd.blind+=blind;sd.sc+=sc;sd.best+=best;n++;
  onAction('staffplan',{dataset:{id:String(g.id)}});if(G.plan.off!==b2.off||G.plan.def!==b2.def)bad('action did not apply');}
 onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}if(G.presser)onAction('press',{dataset:{id:'0'}});if(G.event)onAction('event',{dataset:{id:'0'}});}
Object.keys(sd).forEach(k=>sd[k]=+(sd[k]/n).toFixed(1));console.log('avg edge over',n,'games',sd);
if(!(sd.sc>=sd.blind-0.5))bad('scouted not sharper');if(!(sd.sc>sd.def))bad('staff plan worse than default');if(!(sd.sc<=sd.best))bad('better than best?');
console.log(fail?'FAIL '+fail:'PASS');process.exit(fail?1:0);})().catch(e=>{console.log('FAIL',e.stack);process.exit(1);});
