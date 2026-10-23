const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
script+="\nmodule.exports.__ui={weeklyShare,render,UI,onAction,boot,addCoach,switchCoach,humanIds,bagOf,T,userTeam};";
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
(async()=>{const E=mod.exports,{render,UI,onAction,boot,addCoach,switchCoach,humanIds,bagOf,T,userTeam}=E.__ui;
await boot({});
const sig=()=>{const G=E.get();return [userTeam().name,G.recruits.slice(0,5).map(r=>r.n+r.ovr).join(','),Object.values(G.players).slice(0,5).map(p=>p.n+p.ovr).join(','),G.games.filter(g=>g.home===G.user||g.away===G.user).map(g=>g.home+'-'+g.away).join(' ')].join(' | ');};
onAction('challenge',{dataset:{id:'weekly'}});onAction('start',{dataset:{}});const s1=sig();
onAction('challenge',{dataset:{id:'weekly'}});onAction('start',{dataset:{}});const s2=sig();
console.log(s1.slice(0,300));console.log('same',s1===s2);
const G=E.get();
for(let i=0;i<40&&G.phase==='season';i++){onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}if(G.presser)onAction('press',{dataset:{id:'0'}});if(G.event)onAction('event',{dataset:{id:'0'}});if(i===5){UI.tab='home';render();console.log((el.innerHTML.match(/Weekly gauntlet[^<]*<\/div><span[^>]*>[^<]*/)||[''])[0]);}}
console.log('phase',G.phase,JSON.stringify(G.weekly));
UI.tab='home';render();console.log(/Copy result/.test(el.innerHTML));console.log(E.__ui.weeklyShare());
})().catch(e=>{console.log('FAIL',e.stack);process.exit(1);});
