const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
script+="\nmodule.exports.__ui={render,UI,onAction,boot,addCoach,switchCoach,humanIds,bagOf,T,userTeam};";
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
(async()=>{const E=mod.exports,{render,UI,onAction,boot,addCoach,switchCoach,humanIds,bagOf,T,userTeam}=E.__ui;
await boot({});onAction('pick',{dataset:{id:'16'}});onAction('start',{dataset:{}});const G=E.get();
const A=16;let played=0,crunches=0;
for(let w=0;w<6&&G.phase==='season';w++){
  const wk=G.week;const g=G.games.find(x=>x.week===wk&&(x.home===A||x.away===A));if(!g){onAction('sim',{dataset:{}});continue;}
  const B=g.home===A?g.away:g.home;if(!humanIds().includes(B)){humanIds().filter(h=>h!==A).forEach(()=>{});addCoach(B,'Coach B');}
  switchCoach(A);onAction('sim',{dataset:{}});if(!(UI.live&&UI.live.pre))throw new Error('no prelive');
  let gd=0;while(!UI.live.half&&gd++<300){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(it&&it.k==='half')UI.live.half=true;}
  UI.tab='home';render();if(!el.innerHTML.includes("'s call ("))throw new Error('no named half panel');
  onAction('halftime',{dataset:{id:'open'}});if(UI.live.pre.decided)throw new Error('decided after first call');render();if(!el.innerHTML.includes('Pass the device'))throw new Error('no pass panel');
  onAction('halftime',{dataset:{id:'fire'}});UI._lastPre=UI.live.pre;if(!UI.live.pre.decided)throw new Error('not decided after second');if(!UI.live.feed.some(x=>/Coach B (lit into|is)/.test(x.text)))throw new Error('no B line: '+UI.live.feed.filter(x=>x.q===3).slice(0,3).map(x=>x.text).join('|'));
  gd=0;while(UI.live&&UI.live.pre&&!UI.live.pre.decided4&&gd++<300){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(!it)break;if(it.k==='call4'){UI.live.q4=true;onAction('fourth',{dataset:{id:'go'}});if(UI.live.pre.decided4)throw new Error('q4 decided after first');render();if(!el.innerHTML.includes("Coach B's call"))throw new Error('no B q4 panel');onAction('fourth',{dataset:{id:'blitz'}});}}
  const PRE=UI.live.pre||UI._lastPre;if(UI.live.pre&&!UI.live.pre.decided4)throw new Error('q4 not decided');
  gd=0;while(UI.live&&UI.live.pre&&UI.live.pre.crunch&&!UI.live.pre.crunchDone&&gd++<400){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(!it)break;if(it.k==='crunch'){UI.live.cr=true;render();const h1=el.innerHTML;onAction('crunch',{dataset:{id:'air'}});if(UI.live.pre.crunchDone)throw new Error('crunch done after first');render();if(!el.innerHTML.includes('your defense decides it'))throw new Error('no defense panel');onAction('crunch',{dataset:{id:'pressure'}});crunches++;}}
  const gm=G.games.find(x=>x.id===UI.live.gid);if(!gm._forced)throw new Error('no forced');console.log('wk',wk,'forced',gm._forced.hs+'-'+gm._forced.as,'k1/k2',PRE.k1,PRE.k2,'q4',PRE.k41,PRE.k42,'crunch',PRE.kc1,PRE.kc2,'mine',UI.live.crunch);
  onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});
  // ready A then B
  let gr=0;while(G.week===wk&&gr++<12){if(UI.handoff!=null)onAction('handoffok',{dataset:{}});onAction('sim',{dataset:{}});if(UI.live){if(UI.live.pre){let q=0;while(UI.live&&UI.live.pre&&q++<3)onAction('liveskip',{dataset:{}});}else{onAction('liveskip',{dataset:{}});}onAction('livedone',{dataset:{}});}if(G.user===B&&G.games.find(x=>x.id===gm.id).played===false&&UI.live&&UI.live.pre)throw new Error('B got a prelive for a forced game');}
  if(G.week!==wk+1)throw new Error('week did not advance');const pg=G.games.find(x=>x.id===gm.id);if(!pg.played)throw new Error('not played');played++;
  humanIds().forEach(h=>{switchCoach(h);if(G.presser)onAction('press',{dataset:{id:'0'}});if(G.event)onAction('event',{dataset:{id:'0'}});});
}
console.log('OK played',played,'crunches',crunches);
})().catch(e=>{console.error(e.stack.split('\n').slice(0,4).join('\n'));process.exit(1);});
