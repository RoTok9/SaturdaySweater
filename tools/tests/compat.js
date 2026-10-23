const fs=require('fs');
function mk(file,store){const html=fs.readFileSync(file,'utf8');const script=html.match(/<script>([\s\S]*)<\/script>/)[1]+"\nmodule.exports.__ui={render,UI,onAction,boot};";
 const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1,style:{},appendChild(){},remove(){}};
 const document={getElementById:()=>el,documentElement:{style:{setProperty(){}},dataset:{}},addEventListener(){},body:el,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({style:{},appendChild(){},click(){},remove(){}})};const window={scrollTo(){},addEventListener(){}};
 const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}},document,window,{});return mod.exports;}
const step=(E,n)=>{const {onAction,UI}=E.__ui;for(let i=0;i<n;i++){const G=E.get();if(G.presser)onAction('press',{dataset:{id:'0'}});if(G.event)onAction('event',{dataset:{id:'0'}});if(G.realign)onAction('realign',{dataset:{id:'no'}});if(G.fired&&G.offers&&G.offers.length){onAction('jobyes',{dataset:{id:String(G.offers[0])}});}if(G.phase==='offseason'){onAction('autotrim',{dataset:{}});onAction('spring',{dataset:{}});}
  onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}}};
(async()=>{const old=process.argv[2],neu=process.argv[3];const store={};
 const A=mk(old,store);await A.__ui.boot({});A.__ui.onAction('pick',{dataset:{id:'12'}});A.__ui.onAction('start',{dataset:{}});
 let k=0;A.get().recruits.forEach(r=>{if(k<12&&r.stars>=3){A.__ui.onAction('offer',{dataset:{id:String(r.id)}});k++;}});
 step(A,24);const G0=A.get();await new Promise(r=>setTimeout(r,500));
 console.log('old',old.split('/').pop(),'at',G0.season,G0.phase,'wk',G0.week,'keys',Object.keys(store).length);
 const B=mk(neu,store);await B.__ui.boot({});const G1=B.get();if(!G1)throw new Error('new build did not load the old save');
 console.log('  loaded in new:',G1.season,G1.phase,'wk',G1.week,'team',G1.teams[G1.user].name);
 step(B,40);const G2=B.get();const bad=G2.teams.filter(t=>t.roster.length<40);
 console.log('  after 40 steps:',G2.season,G2.phase,'wk',G2.week,'short rosters',bad.length,'players',Object.keys(G2.players).length);
 if(bad.length)throw new Error('short rosters');process.exit(0);
})().catch(e=>{console.log('FAIL',e.stack.split('\n').slice(0,4).join('\n'));process.exit(1);});
