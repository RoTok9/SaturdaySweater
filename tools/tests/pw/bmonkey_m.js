const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|net::|favicon|fonts/.test(m.text()))errs.push('C:'+m.text());});
await p.goto('file:///home/claude/gridiron-dynasty.html');await p.waitForTimeout(400);
await p.evaluate(()=>{document.getElementById('coachName').value='Coach';UI.pickTeam=+(localStorage.getItem('x')||5);onAction('start',{dataset:{}});});
const SKIP=new Set(['reset','resetyes','newgame','share','export','import','leaguepreset','theme','slot','slotload','slotsave','slotdel','olcreate','oljoin','ollookup','oltoggle','olleave','olserver','coachadd','coachremove','coachswitch','sim','liveskip','livedone','tab','guideoff','leagueq','leagueapply','leaguerow','leagueimport','leagueexport','leagueopen','job','jobyes','cutyes','autotrim','realign','start','pick','checkupdate','update','confsel','leagueconf','tedit','switch','delslot','delslotyes','newslot','load','loadslot','leaguecopy','copy','halftime','fourth','livespeed','fxtoggle']);
let clicks=0;
for(let week=0;week<40;week++){
  for(let k=0;k<5;k++){
    const tabs=['home','schedule','recruit','roster','polls','program'];const t=tabs[Math.floor(Math.random()*6)];
    await p.evaluate(t=>{onAction('tab',{dataset:{id:t}});},t);
    const btns=await p.$$('[data-act]');if(!btns.length)continue;
    const cands=[];for(const el of btns){const a=await el.getAttribute('data-act');if(SKIP.has(a))continue;const dis=await el.getAttribute('disabled');if(dis!=null)continue;const vis=await el.isVisible();if(!vis)continue;cands.push(el);}
    if(!cands.length)continue;const el=cands[Math.floor(Math.random()*cands.length)];try{await el.click({timeout:2000});clicks++;}catch(e){}
    await p.waitForTimeout(60);
  }
  await p.evaluate(()=>{onAction('sim',{dataset:{}});});await p.waitForTimeout(300);
  await p.evaluate(()=>{if(UI.live&&UI.live.pre){const ks=['stay','open','run','fire'];let g=0;while(!UI.live.half&&g++<300){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(it&&it.k==='half')UI.live.half=true;}render();}});
  const hb=await p.$$('[data-act="halftime"]');if(hb.length){await hb[Math.floor(Math.random()*hb.length)].click();clicks++;await p.waitForTimeout(300);}await p.evaluate(()=>{if(UI.live&&UI.live.pre&&!UI.live.pre.decided4){let g=0;while(!UI.live.q4&&UI.live.pre&&!UI.live.pre.decided4&&g++<300){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(!it)break;if(it.k==='call4'){UI.live.q4=true;}}clearTimeout(liveTimer);render();}});const fb=await p.$$('[data-act="fourth"]');if(fb.length){await fb[Math.floor(Math.random()*fb.length)].click();clicks++;await p.waitForTimeout(300);}await p.evaluate(()=>{if(UI.live&&UI.live.pre&&UI.live.pre.crunch&&!UI.live.pre.crunchDone){let g=0;while(!UI.live.cr&&g++<400){UI.live.shown++;const it=UI.live.feed[UI.live.shown-1];if(!it)break;if(it.k==='crunch'){UI.live.cr=true;}}clearTimeout(liveTimer);render();}});const cb=await p.$$('[data-act="crunch"]');if(cb.length){await cb[Math.floor(Math.random()*cb.length)].click();clicks++;await p.waitForTimeout(300);}const bf=await p.$$('[data-act="byefocus"]');if(bf.length){await bf[Math.floor(Math.random()*bf.length)].click();clicks++;}const hi=await p.$$('[data-act="halfinj"]');if(hi.length){await hi[Math.floor(Math.random()*hi.length)].click();clicks++;}
  await p.evaluate(()=>{if(UI.live){onAction('liveskip',{dataset:{}});}});await p.waitForTimeout(200);
  const cont=await p.$('[data-act="livedone"]');if(cont){await cont.click();clicks++;}
  await p.evaluate(()=>{if(G.presser)onAction('press',{dataset:{id:String(Math.floor(Math.random()*3))}});if(G.event)onAction('event',{dataset:{id:'0'}});if(G.phase==='offseason'){if(G.realign)onAction('realign',{dataset:{id:'no'}});if(G.fired&&G.offers.length){onAction('job',{dataset:{id:String(G.offers[0])}});onAction('jobyes',{dataset:{id:String(G.offers[0])}});}}});
  const st=await p.evaluate(()=>[G.phase,G.week,G.season]);if(st[0]==='offseason'){await p.evaluate(()=>{onAction('autotrim',{dataset:{}});onAction('sim',{dataset:{}});});}
  if(errs.length){console.log('ERRORS after week loop',week,errs.slice(0,5));break;}
}
const st=await p.evaluate(()=>[G.phase,G.week,G.season,userTeam().name]);console.log('end',st,'clicks',clicks,'errors',errs.length);errs.slice(0,8).forEach(e=>console.log(e));
await b.close();})();
