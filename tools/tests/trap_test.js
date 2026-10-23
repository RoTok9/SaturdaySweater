const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
script+="\nmodule.exports.__ui={render,UI,onAction,boot,addCoach,switchCoach,humanIds,bagOf,T,userTeam};";
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
(async()=>{const E=mod.exports,{render,UI,onAction,boot,addCoach,switchCoach,humanIds,bagOf,T,userTeam}=E.__ui;
await boot({});
onAction('pick',{dataset:{id:'0'}});onAction('start',{dataset:{}});const G=E.get();console.log(userTeam().name);let traps=0;
for(let i=0;i<14&&G.phase==='season';i++){const g=G.games.find(x=>x.week===G.week&&!x.played&&(x.home===G.user||x.away===G.user));if(g){UI.tab='home';render();const has=/Trap game: heavy favorite/.test(el.innerHTML);if(has){traps++;const k=i%2?'lock':'ahead';onAction('trap',{dataset:{id:k}});console.log('wk',G.week,k,JSON.stringify(G.trapFocus));}
 const pe=E.planEdge?E.planEdge(g):null;}
 onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}if(G.presser)onAction('press',{dataset:{id:'0'}});if(G.event)onAction('event',{dataset:{id:'0'}});}
console.log('traps',traps,userTeam().w+'-'+userTeam().l);
})().catch(e=>{console.log('FAIL',e.stack);process.exit(1);});
