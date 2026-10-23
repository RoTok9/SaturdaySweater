const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
script+="\nmodule.exports.__ui={render,UI,onAction,boot,P};";
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
(async()=>{const E=mod.exports,{render,UI,onAction,boot,P}=E.__ui;
await boot({});onAction('pick',{dataset:{id:'16'}});onAction('start',{dataset:{}});const G=E.get();
const calls=['stay','open','run','fire','rest'];let n=0;const res=[];const CR={n:0};
while(G.phase==='season'&&n<10){const w=G.week;onAction('sim',{dataset:{}});
  if(UI.live&&UI.live.pre){// play through to the half
    let guard=0;while(!UI.live.half&&guard++<200){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(it.k==='half'){UI.live.half=true;}}
    UI.tab='home';render();if(!el.innerHTML.includes("coach's call"))throw new Error('no half panel');{const m=el.innerHTML.match(/class="adv">(.*?)<\/div>/);if(!m)throw new Error('no advice');if(n<3)console.log('ADV',m[1].replace(/<[^>]+>/g,''));}
    const h1=UI.live.pre.h1;const k=calls[n%calls.length];onAction('halftime',{dataset:{id:k}});
    let g=G.games.find(x=>x.id===UI.live.gid);if(g.played)throw new Error('played too early');const q3=Object.assign({},UI.live.pre.q3);
    {let guard=0;while(UI.live&&UI.live.pre&&!UI.live.pre.decided4&&guard++<300){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(!it)break;if(it.k==='call4'){const me=g.home===G.user;const lead=me?it.hs-it.as:it.as-it.hs;if(Math.abs(lead)<=10){UI.live.q4=true;UI.tab='home';render();if(!el.innerHTML.includes('Fourth quarter'))throw new Error('no q4 panel');const k4=['stay','go','clock','prevent','blitz'][n%5];onAction('fourth',{dataset:{id:k4}});}else{onAction('fourth',{dataset:{id:'stay'}});}}}}
    let crK=null;{let guard=0;while(UI.live&&UI.live.pre&&UI.live.pre.crunch&&!UI.live.pre.crunchDone&&guard++<400){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(!it)throw new Error('ran out of feed before crunch');if(it.k==='crunch'){UI.live.cr=true;UI.tab='home';render();if(!el.innerHTML.includes('Two minutes'))throw new Error('no crunch panel');{const m=el.innerHTML.match(/class="adv">(.*?)<\/div>/);if(!m)throw new Error('no crunch advice');console.log('CADV',m[1].replace(/<[^>]+>/g,''));}const S=UI.live.pre;const mine=S.ball===G.user;crK=(mine?['air','work','fg']:['prevent','pressure','base'])[n%3];onAction('crunch',{dataset:{id:crK}});}}}
    g=G.games.find(x=>x.id===UI.live.gid);if(!g.played)throw new Error('not played after calls');if(crK){CR.n++;const cr=UI.live.crunch;if(!cr)throw new Error('crunch not recorded');const ci=UI.live.feed.findIndex(x=>x.k==='crunch');const after=UI.live.feed.slice(ci+1);if(!after.length||after[after.length-1].k!=='end')throw new Error('bad tail');const sc=after.filter(x=>x.k==='s');CR[sc.length?'scored':'none']=(CR[sc.length?'scored':'none']||0)+1;const times=after.filter(x=>x.q===4&&x.k!=='end').map(x=>x.time);if(times.some(t=>{const m=String(t).match(/(\d+):(\d+)/);return m&&(+m[1]*60+ +m[2])>120;}))throw new Error('crunch item after 2:00: '+times.join(','));}if(G.week!==w+1)throw new Error('week did not advance');
    const feedH=UI.live.feed.filter(x=>x.k==='s'&&x.q<=2);const sumH=feedH.reduce((a,x)=>a+(x.team===g.home?x.pts:0),0),sumA=feedH.reduce((a,x)=>a+(x.team!==g.home?x.pts:0),0);
    if(sumH!==h1.hs||sumA!==h1.as)throw new Error('half mismatch '+sumH+'-'+sumA+' vs '+h1.hs+'-'+h1.as);
    const box=g.box;const qH=box.qs[0][0]+box.qs[0][1],qA=box.qs[1][0]+box.qs[1][1];if(qH!==h1.hs||qA!==h1.as)throw new Error('box half mismatch '+qH+'-'+qA);if(g.box.qs[0][2]!==q3.hs||g.box.qs[1][2]!==q3.as)throw new Error('q3 mismatch '+JSON.stringify(g.box.qs)+' vs '+JSON.stringify(q3));
    {const fs2=UI.live.feed.filter(x=>x.k==='s').map(x=>x.q+'|'+x.pts+'|'+x.team).sort().join(',');const bs=g.box.plays.map(x=>x.q+'|'+x.pts+'|'+x.team).sort().join(',');if(fs2!==bs)throw new Error('feed/box mismatch\n'+fs2+'\n'+bs);const fe=UI.live.feed[UI.live.feed.length-1];if(fe.hs!==g.hs||fe.as!==g.as)throw new Error('final mismatch');}res.push(`${k}:${h1.hs}-${h1.as}>${g.hs}-${g.as}`);onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});n++;}
  else if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}
  if(G.presser)onAction('press',{dataset:{id:'0'}});if(G.event)onAction('event',{dataset:{id:'0'}});}
console.log(res.join(' | '));console.log('crunch',JSON.stringify(CR),'calls',JSON.stringify(G.coach.calls));console.log('record',E.userTeam().w+'-'+E.userTeam().l,'coach',G.coach.w+'-'+G.coach.l);
// skip path from pre
onAction('sim',{dataset:{}});if(UI.live&&UI.live.pre){onAction('liveskip',{dataset:{}});console.log('skip ok',UI.live.done,G.games.find(x=>x.id===UI.live.gid).played);onAction('livedone',{dataset:{}});}
})().catch(e=>{console.error(e.stack.split('\n').slice(0,5).join('\n'));process.exit(1);});
