// Recruit texts are fresh (no stale threads, no emojis, no wrong-result lines) and postseason pressers fit the game.
const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
script+="\nmodule.exports.__ui={render,UI,onAction,boot,userTeam,PRESS,textOut};";
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
const EMO=/[\u{1F000}-\u{1FFFF}]/u;let fail=0;const bad=m=>{fail++;console.log('BAD',m);};
(async()=>{const E=mod.exports,{render,UI,onAction,boot,userTeam,PRESS}=E.__ui;
await boot({});
onAction('pick',{dataset:{id:'0'}});onAction('start',{dataset:{}});const G=E.get();
const postQ=[];let texts=0,sit=0,inb=0;const seenMsgs={};
for(let season=0;season<3;season++){
 for(let i=0;i<22&&G.phase==='season';i++){
  if(G.week<=14){G.recruits.filter(r=>r.committed==null&&!r.offer).slice(0,3).forEach(r=>onAction('offer',{dataset:{id:String(r.id)}}));
   G.hours=Math.max(G.hours,20);
   G.recruits.filter(r=>r.offer&&r.committed==null&&!r.convo).slice(0,4).forEach(r=>{onAction('text',{dataset:{id:String(r.id)}});const c=r.convo;if(!c)return;texts++;if(EMO.test(c.m))bad('emoji '+c.m);
     const k=r.txSeen[r.txSeen.length-1];if(/^[wlnrthdv]/.test(k))sit++;const L=G.lastResult;
     if(k[0]==='w'&&!(L&&L.won))bad('win text without a win');if(k[0]==='l'&&!(L&&!L.won))bad('loss text without a loss');
     if(seenMsgs[r.id]===c.m&&/^[wlnrtdv]/.test(k))bad('same text twice in a row: '+c.m);seenMsgs[r.id]=c.m;
     if(i%2)onAction('reply',{dataset:{id:String(r.id),i:'0'}});});
   G.recruits.forEach(r=>{const c=r.convo;if(c&&c.inbound){inb++;if(EMO.test(c.m))bad('inbound emoji '+c.m);if(c.wk!==G.week&&!c.done)bad('stale inbound from wk '+c.wk);}});
  }
  onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}
  G.recruits.forEach(r=>{const c=r.convo;if(c&&!c.done&&!c.inbound&&c.wk!=null&&c.wk<G.week)bad('stale outbound thread from wk '+c.wk+' now '+G.week);});
  if(G.presser){const t=G.presser.info.type;if(t&&t!=='reg'){postQ.push(t+'/'+(G.presser.info.round||'')+(G.presser.info.won?' W':' L')+': '+G.presser.q);if(/playoff team\?|hot-seat|Where does the team go|What did you like\?/.test(G.presser.q))bad('regular-season question in postseason: '+G.presser.q);}
   render();if(/[\u{1F000}-\u{1FFFF}]/u.test(el.innerHTML))bad('emoji in UI');onAction('press',{dataset:{id:'0'}});}
  if(G.event)onAction('event',{dataset:{id:'0'}});
 }
 if(G.phase!=='season'){E.runOffseason&&E.runOffseason();if(G.phase!=='season'&&E.startNextSeason)E.startNextSeason();}
}
// every postseason result has a fitting template
const kinds=[['ccg',null,true],['ccg',null,false],['bowl',null,true],['bowl',null,false],...['r1','qf','sf','f'].flatMap(r=>[['po',r,true],['po',r,false]])];
kinds.forEach(([type,round,won])=>{const info={type,round,won,opp:'X',oppRank:5,myRank:3,margin:7,close:false,blowout:false,bowl:'Harvest',confName:'SEC'};const n=PRESS.filter(t=>t.post&&t.ctx(info)).length;if(!n)bad('no postseason presser for '+type+' '+round+' '+won);});
console.log('texts',texts,'situational',sit,'inbound seen',inb,'postseason pressers',postQ.length);postQ.slice(0,8).forEach(q=>console.log('  ',q));
if(texts<20||sit<5)bad('too few texts exercised');
console.log(fail?'FAIL '+fail:'PASS');process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL',e.stack);process.exit(1);});
