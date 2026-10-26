// Build my board / Work my board: one-tap recruiting that stays within the rules.
const fs=require('fs');const html=fs.readFileSync('/home/claude/gridiron-dynasty.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el={innerHTML:'',value:'Coach',addEventListener(){},querySelector:()=>({}),classList:{add(){},remove(){},toggle(){}},offsetWidth:1};const store={};
const document={getElementById:()=>el,documentElement:{style:{setProperty(){}}},addEventListener(){},body:el,querySelector:()=>null,createElement:()=>({style:{},appendChild(){}})};const window={scrollTo(){}};
script+="\nmodule.exports.__ui={render,UI,onAction,boot,userTeam,needs,CLASS_CAP};";
const mod={exports:{}};new Function('module','localStorage','document','window','navigator',script)(mod,{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},document,window,{});
let fail=0;const bad=m=>{fail++;console.log('BAD',m);};
(async()=>{const E=mod.exports,{render,UI,onAction,boot,userTeam,needs,CLASS_CAP}=E.__ui;await boot({});
for(const pickId of ['0','60','120']){
onAction('pick',{dataset:{id:pickId}});onAction('start',{dataset:{}});const G=E.get();const u=userTeam();
onAction('tab',{dataset:{id:'recruit'}});render();if(!/Build my board/.test(el.innerHTML))bad('no build button');
onAction('buildboard',{dataset:{}});const off=G.recruits.filter(r=>r.offer);const nd=needs();
if(off.length<10||off.length>18)bad('offers '+off.length);const per={};off.forEach(r=>per[r.pos]=(per[r.pos]||0)+1);
Object.entries(per).forEach(([p,n])=>{if(n>(p==='K'||p==='P'?1:nd.includes(p)?4:2))bad('too many at '+p+' '+n);});
if(!off.some(r=>nd.includes(r.pos)))bad('no need positions');if(off.some(r=>r.late||r.committed!=null))bad('offered late/committed');
const h0=G.hours;onAction('workboard',{dataset:{}});if(G.hours>=3)bad('hours left '+G.hours);if(G.hours<0)bad('negative hours');
render();if(/Build my board/.test(el.innerHTML))bad('build still offered at 18');
console.log(u.name,'prestige',u.prestige,'offers',off.length,'stars',off.map(r=>r.stars).join(''),'hours',h0,'->',G.hours,'needs',nd.join(','));
for(let i=0;i<3;i++){onAction('sim',{dataset:{}});if(UI.live){onAction('liveskip',{dataset:{}});onAction('livedone',{dataset:{}});}if(G.presser)onAction('press',{dataset:{id:'0'}});if(G.event)onAction('event',{dataset:{id:'0'}});onAction('workboard',{dataset:{}});}
UI.rLimit=30;render();onAction('rmore',{dataset:{}});if(UI.rLimit!==60)bad('rmore');onAction('rpos',{dataset:{id:'QB'}});if(UI.rLimit!==30)bad('limit reset');
onAction('reset',{dataset:{}});onAction('resetyes',{dataset:{}});}
console.log(fail?'FAIL '+fail:'PASS');process.exit(fail?1:0);})().catch(e=>{console.log('FAIL',e.stack);process.exit(1);});
