const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1]+"\nmodule.exports.__ui={render,UI,onAction,boot,NETget:()=>NET,onlineCreate,onlineLookup,onlineJoin,onlineRefresh,onlineReady,onlinePoll,humanIds,T,userTeam,switchCoach,commitsOf,bagOf,coachDelta,serialize};";
function mk(){const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
 const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
 const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
 const E=mod.exports;E.el=el;E.store=store;E.ls={getItem:k=>store[k]||null};return E;}
(async()=>{
const A=mk(),B=mk();for(const E of [A,B]){E.store['gridiron-server']='http://localhost:8787';await E.__ui.boot({});}
const code=await A.__ui.onlineCreate('Move League',16,'Coach A');await B.__ui.onlineJoin(code,40,'Coach B');await A.__ui.onlineRefresh();
const play=E=>{const G=E.get();if(G.presser)E.__ui.onAction('press',{dataset:{id:'0'}});if(G.event)E.__ui.onAction('event',{dataset:{id:'0'}});if(G.realign)E.__ui.onAction('realign',{dataset:{id:'no'}});E.__ui.onAction('autotrim',{dataset:{}});};
let guard=0;while(A.get().phase!=='offseason'&&guard++<40){play(A);play(B);await A.__ui.onlineReady(true);await B.__ui.onlineReady(true);await A.__ui.onlinePoll();await B.__ui.onlinePoll();}
console.log('phase',A.get().phase,B.get().phase);
await B.__ui.onlineRefresh();const G=B.get();if(G.fired){console.log('B was fired for real');}
const target=G.teams.filter(t=>!B.__ui.humanIds().includes(t.id)&&t.prestige<=4)[0].id;G.offers=[target];G.fired=true;
B.__ui.onAction('jobyes',{dataset:{id:String(target)}});console.log('B took job at',B.__ui.T(target).name,'user now',B.get().user);
play(A);play(B);await B.__ui.onlineReady(true);await A.__ui.onlineReady(true);
console.log('A humans',A.__ui.humanIds().join(','),'phase',A.get().phase,'season',A.get().season);
await B.__ui.onlinePoll();const NB=B.__ui.NETget();console.log('B NET tid',NB.tid,'user team',B.__ui.userTeam().name,'err',NB.err,'phase',B.get().phase);
if(!A.__ui.humanIds().includes(target)||A.__ui.humanIds().includes(40))throw new Error('A did not see the move');
if(NB.tid!==target||NB.err)throw new Error('B lost its seat');
// one more week of play to be sure the moved coach can ready
guard=0;const wk0=A.get().week+'/'+A.get().phase;play(A);play(B);await B.__ui.onlineReady(true);await A.__ui.onlineReady(true);await B.__ui.onlinePoll();console.log('next step',wk0,'->',A.get().week+'/'+A.get().phase,'B',B.get().week+'/'+B.get().phase,'B err',B.__ui.NETget().err);
if(A.get().phase+A.get().week===wk0)throw new Error('stuck');
console.log('OK');process.exit(0);
})().catch(e=>{console.log('FAIL',e.stack.split('\n').slice(0,4).join('\n'));process.exit(1);});
