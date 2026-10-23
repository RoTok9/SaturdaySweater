const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1]+"\nmodule.exports.__ui={render,UI,onAction,boot,NETget:()=>NET,onlineCreate,onlineLookup,onlineJoin,onlineRefresh,onlineReady,onlinePoll,humanIds,T,userTeam,switchCoach,commitsOf,bagOf,coachDelta,serialize};";
function mk(){const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
 const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
 const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
 const E=mod.exports;E.el=el;E.store=store;E.ls={getItem:k=>store[k]||null};return E;}
(async()=>{
const A=mk(),B=mk(),C=mk();for(const E of [A,B,C]){E.store['gridiron-server']='http://localhost:8787';await E.__ui.boot({});}
const code=await A.__ui.onlineCreate('Kick League',16,'Coach A');
// B and C join at the same time: registration must survive the race
await Promise.all([B.__ui.onlineJoin(code,40,'Coach B'),C.__ui.onlineJoin(code,70,'Coach C')]);
await A.__ui.onlineRefresh();await B.__ui.onlineRefresh();
const hs=E=>E.__ui.humanIds().slice().sort((a,b)=>a-b).join(',');
console.log('humans A',hs(A),'B',hs(B),'C',hs(C));if(hs(A)!=='16,40,70')throw new Error('join race lost a coach');
// B readies, then A kicks C; B's ready must survive and the week should advance once A readies
await B.__ui.onlineReady(true);
await A.__ui.onlinePoll();A.__ui.UI.tab='home';A.__ui.render();console.log('remove button',/data-act="olkick"/.test(A.el.innerHTML));A.__ui.onAction('olkickyes',{dataset:{id:'70'}});await new Promise(r=>setTimeout(r,1500));
await A.__ui.onlineRefresh();console.log('A humans after kick',hs(A),'coaches',A.__ui.NETget().coaches.map(c=>c.name+(c.ready?'*':'')).join(','));
if(hs(A)!=='16,40')throw new Error('kicked coach still human');
const wk=A.get().week;await A.__ui.onlineReady(true);await A.__ui.onlinePoll();console.log('week',wk,'->',A.get().week);if(A.get().week!==wk+1)throw new Error('did not advance');
await B.__ui.onlineRefresh();console.log('B week',B.get().week,'humans',hs(B));
await C.__ui.onlineRefresh();console.log('C err',C.__ui.NETget().err);
console.log('OK');process.exit(0);
})().catch(e=>{console.log('FAIL',e.stack);process.exit(1);});
