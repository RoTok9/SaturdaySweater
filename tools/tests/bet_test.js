const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
script+="\nmodule.exports.__ui={render,UI,onAction,boot,addCoach,switchCoach,humanIds,bagOf,T,userTeam};";
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
(async()=>{const E=mod.exports,{render,UI,onAction,boot,addCoach,switchCoach,humanIds,bagOf,T,userTeam}=E.__ui;
await boot({});onAction('pick',{dataset:{id:'16'}});onAction('start',{dataset:{}});const G=E.get();

const A=16;while(!G.games.find(x=>x.week===G.week&&(x.home===A||x.away===A))){onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}}const wk=G.week;const g=G.games.find(x=>x.week===wk&&(x.home===A||x.away===A));const B=g.home===A?g.away:g.home;addCoach(B,'Coach B');switchCoach(A);
const html=()=>{UI.tab='home';render();return el.innerHTML;};
if(!/Side bet/.test(html()))throw new Error('no bet card');
const nilA0=bagOf(A).nil,nilB0=bagOf(B).nil;
onAction('bet',{dataset:{id:process.argv[2]||'nil'}});if(!/Waiting on/.test(html()))throw new Error('no pending');
switchCoach(B);if(!/wants a side bet/.test(html()))throw new Error('B no offer');console.log('Bnil',G.nil,JSON.stringify(G.bets));onAction('bet',{dataset:{id:'accept'}});console.log(JSON.stringify(G.bets));if(!/Shook on it/.test(html()))throw new Error('not ok');
switchCoach(A);if(!/Shook on it/.test(html()))throw new Error('A not ok');
// play the week: sim for both; skip live
for(let i=0;i<4&&G.week===wk;i++){onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}if(G.presser)onAction('press',{dataset:{id:'0'}});if(G.event)onAction('event',{dataset:{id:'0'}});if(G.week===wk){const o=humanIds().find(h=>h!==G.user);switchCoach(o);onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}}}
console.log('week',wk,'->',G.week,'played',g.played,g.hs,g.as,'bets',JSON.stringify(G.bets),'log',JSON.stringify(G.betLog));
console.log('nil A',nilA0,'->',bagOf(A).nil,'B',nilB0,'->',bagOf(B).nil);
const ns=[...(bagOf(A).news||[]),...(bagOf(B).news||[])].map(n=>n.t||n.text||n).filter(t=>/bet|paid up|NIL fund/.test(String(t)));console.log(ns.slice(0,6));
})().catch(e=>{console.log('FAIL',e.message);process.exit(1);});
