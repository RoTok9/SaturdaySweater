const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
script+="\nmodule.exports.__ui={render,UI,onAction,boot,P};";
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
(async()=>{const E=mod.exports,{render,UI,onAction,boot,P}=E.__ui;
await boot({});onAction('pick',{dataset:{id:String(+process.argv[2]||3)}});onAction('start',{dataset:{}});const G=E.get();
const SKIP=new Set(['reset','resetyes','newgame','share','export','import','leaguepreset','theme','slot','slotload','slotsave','slotdel','olcreate','oljoin','ollookup','oltoggle','olleave','olserver','coachadd','coachremove','coachswitch','sim','liveskip','livedone','tab','guideoff','leagueq','leagueapply','leaguerow','leagueimport','leagueexport','leagueopen','job','jobyes','nilinvest','upgrade','stadium','cutyes','autotrim','realign','start','pick','checkupdate','update','confsel','leagueconf','tedit','leaguerename','leaguecolor','switch','delslot','delslotyes','newslot','load','loadslot','rename','slotrename','leaguecopy','copy','sharecopy','olcopy','copycode']);
const tabs=['home','schedule','recruit','roster','polls','program'];let clicks=0;const seen={};
const rx=/data-act="([a-z0-9_]+)"(?:[^>]*?data-id="([^"]*)")?(?:[^>]*?data-kind="([^"]*)")?(?:[^>]*?data-key="([^"]*)")?(?:[^>]*?data-i="([^"]*)")?(?:[^>]*?data-to="([^"]*)")?/g;
const step=()=>{UI.tab=tabs[Math.floor(Math.random()*tabs.length)];render();const acts=[];let m;const html=el.innerHTML;while((m=rx.exec(html))){if(!SKIP.has(m[1])&&!/disabled/.test(html.slice(Math.max(0,m.index-200),m.index)))acts.push({act:m[1],id:m[2],kind:m[3],key:m[4],i:m[5],to:m[6]});}
  for(let k=0;k<6&&acts.length;k++){const a=acts[Math.floor(Math.random()*acts.length)];seen[a.act]=(seen[a.act]||0)+1;clicks++;const last=a;try{onAction(a.act,{dataset:{id:a.id,kind:a.kind,key:a.key,i:a.i,to:a.to}});render();}catch(e){console.error('ACTION FAILED',JSON.stringify(a),'\n',e.stack.split('\n').slice(0,4).join('\n'));process.exit(1);}}};
const seasons=+process.argv[3]||3;
for(let s=0;s<seasons;s++){
  while(G.phase==='season'){for(let i=0;i<4;i++)step();onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}if(G.presser)onAction('press',{dataset:{id:String(Math.floor(Math.random()*3))}});if(G.event)onAction('event',{dataset:{id:String(Math.floor(Math.random()*2))}});tabs.forEach(t=>{UI.tab=t;render();});}
  onAction('sim',{dataset:{}});for(let i=0;i<8;i++)step();if(G.realign)onAction('realign',{dataset:{id:Math.random()<0.5?'yes':'no'}});if(G.fired&&G.offers.length){onAction('job',{dataset:{id:String(G.offers[0])}});onAction('jobyes',{dataset:{id:String(G.offers[0])}});}
  onAction('autotrim',{dataset:{}});onAction('sim',{dataset:{}});if(G.phase!=='season'){console.log('stuck in',G.phase);const u=E.userTeam();console.log('roster',u.roster.length,'fired',G.fired,'offers',G.offers,'realign',!!G.realign);break;}
  console.log('season',G.season,'team',E.userTeam().name,'clicks',clicks);
}
console.log('actions used',Object.keys(seen).length,Object.entries(seen).sort((a,b)=>b[1]-a[1]).slice(0,40).map(([k,v])=>k+':'+v).join(' '));
// save round trip
const ser=E.serialize?E.serialize(G):null;if(ser)console.log('save ok',ser.length);
})().catch(e=>{console.error(e.stack.split('\n').slice(0,6).join('\n'));process.exit(1);});
