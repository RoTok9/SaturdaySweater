// Friends hub + leaderboard end to end in Chromium against the mock league server (node server/mock.mjs 8787).
// Coach A creates a listed league from the hub, coach B opens the invite link and joins, B finds A by name,
// leaderboard join/post/rename, report hides a league, a solo dynasty goes online from the Program tab.
const {chromium}=require('playwright');const fs=require('fs');
const SRC=process.argv[2]||'/home/claude/gridiron-dynasty.html';const PAGE='/tmp/hub_test_page.html';
let html=fs.readFileSync(SRC,'utf8');if(!/<meta name="viewport"/.test(html))html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+html;fs.writeFileSync(PAGE,html);
let fails=0,checks=0;const ok=(c,m)=>{checks++;if(!c){fails++;console.log('FAIL:',m);}};
(async()=>{const b=await chromium.launch({executablePath:process.env.PW_CHROME||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const mk=async(w,h)=>{const ctx=await b.newContext({viewport:{width:w,height:h}});await ctx.addInitScript(()=>{try{localStorage.setItem('gridiron-server','http://localhost:8787');}catch(e){}});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));return p;};
const click=async(p,sel)=>{await p.click(sel);await p.waitForTimeout(350);};
const text=p=>p.evaluate(()=>document.body.innerText);
// ---------- A creates a league from the start screen
const A=await mk(1280,900);await A.goto('file://'+PAGE);await A.waitForTimeout(800);
ok((await text(A)).includes('Play with friends'),'start screen has Play with friends');
await click(A,'[data-act="hubopen"][data-id="friends"]');await A.waitForTimeout(500);
ok((await text(A)).includes('Start an online league'),'hub opens');
await A.fill('#hubCoach','Coach Alpha');await A.selectOption('#hubTeam','16');await A.fill('#leagueName','Thursday Crew');
await click(A,'[data-act="hubcreate"]');
ok((await text(A)).includes('Agree to the community rules'),'rules required before create');
await click(A,'[data-act="rulesok"]');await A.fill('#hubCoach','Coach Alpha');await A.fill('#leagueName','Thursday Crew');await A.selectOption('#hubTeam','16');
await click(A,'[data-act="hubcreate"]');await A.waitForTimeout(1500);
const code=await A.evaluate(()=>{const c=document.querySelector('.invite .code');return c&&c.textContent.trim();});
ok(/^[A-Z0-9]{6}$/.test(code||''),'invite card with code: '+code);
const sms=await A.evaluate(()=>{const a=[...document.querySelectorAll('.invite a')].find(x=>/Text a friend/.test(x.textContent));return a&&a.getAttribute('href');});
ok(sms&&sms.startsWith('sms:')&&decodeURIComponent(sms).includes(code)&&decodeURIComponent(sms).includes('#join='+code),'text-a-friend link carries code and join link');
ok(!decodeURIComponent(sms).includes('apps.apple.com'),'no App Store link before launch');
await click(A,'[data-act="hubplay"]');await A.waitForTimeout(500);
ok(await A.evaluate(()=>!!(G&&G.online&&NET&&NET.id)),'A is in the online dynasty');
// bad name blocked client side
const A2=await mk(1280,900);await A2.goto('file://'+PAGE);await A2.waitForTimeout(700);await click(A2,'[data-act="hubopen"][data-id="friends"]');await click(A2,'[data-act="rulesok"]');
await A2.fill('#hubCoach','sh1t head');await A2.fill('#leagueName','x');await click(A2,'[data-act="hubcreate"]');
ok((await text(A2)).includes('That name is not allowed'),'client name filter');
// ---------- B opens the invite link on a phone
const B=await mk(390,844);await B.goto('file://'+PAGE+'#join='+code);await B.waitForTimeout(1500);
let tb=await text(B);ok(tb.includes('Thursday Crew')&&tb.includes('Coach Alpha'),'invite link opens hub with the league looked up');
ok(await B.evaluate(()=>location.hash===''),'join hash cleared');
const taken=await B.evaluate(()=>[...document.querySelectorAll('#joinTeam option')].some(o=>o.value==='16'));ok(!taken,'taken school not offered');
await B.fill('#hubCoach','Coach Bravo');await B.selectOption('#joinTeam','40');await click(B,'[data-act="hubjoin"]');
ok((await text(B)).includes('Agree to the community rules'),'join needs rules');
await click(B,'[data-act="rulesok"]');await B.fill('#hubCoach','Coach Bravo');await B.selectOption('#joinTeam','40');await click(B,'[data-act="hubjoin"]');await B.waitForTimeout(2500);
ok(await B.evaluate(()=>!!(G&&G.online&&NET&&NET.id)&&G.user===40),'B joined as school 40');
// B searches for A by coach name from the hub
await B.evaluate(()=>{onAction('hubopen',{dataset:{id:'friends'}});});await B.waitForTimeout(800);
await B.fill('#hubQ','alpha');await click(B,'[data-act="hubsearch"]');await B.waitForTimeout(600);
tb=await text(B);ok(tb.includes('Thursday Crew')&&tb.includes('Coach Bravo'),'search by coach name finds league with both coaches');
ok(await B.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'hub fits phone width');
await B.screenshot({path:'/tmp/hub_phone.png',fullPage:false});
await click(B,'[data-act="hubclose"]');
// ---------- A sees B in the Program tab, can block/report, toggles listing
await A.evaluate(()=>onlineRefresh());await A.waitForTimeout(1200);await A.evaluate(()=>{UI.tab='program';render();});await A.waitForTimeout(400);
let ta=await text(A);ok(ta.includes('Coach Bravo')&&ta.toLowerCase().includes('league code'),'program tab online card lists coach and invite');
await click(A,'[data-act="block"][data-n="Coach Bravo"]');ok((await text(A)).includes('Blocked coach'),'block coach');
await click(A,'[data-act="unblock"]');ok((await text(A)).includes('Coach Bravo'),'unblock coach');
await click(A,'[data-act="ollisted"]');await A.waitForTimeout(700);ok(await A.evaluate(()=>NET.listed===false),'commissioner unlists');
await click(A,'[data-act="ollisted"]');await A.waitForTimeout(700);ok(await A.evaluate(()=>NET.listed===true),'commissioner relists');
// ---------- leaderboard
await click(A,'[data-act="hubopen"][data-id="lb"]');await A.waitForTimeout(700);
await A.fill('#lbName','Alpha Dog');await click(A,'[data-act="lbjoin"]');await A.waitForTimeout(2500);
ta=await text(A);ok(ta.includes('Posting as Alpha Dog'),'joined leaderboard');
await click(A,'[data-act="lbload"]');await A.waitForTimeout(800);ta=await text(A);ok(/Alpha Dog/.test(ta)&&/#1/.test(ta),'on the board at #1: '+JSON.stringify(await A.evaluate(()=>({lb:UI.lb,p:profile().on}))).slice(0,400));
await A.fill('#lbName','Alpha Prime');await click(A,'[data-act="lbname"]');await A.waitForTimeout(1200);ok((await text(A)).includes('Alpha Prime'),'rename');
ta=await text(A);ok(/race/i.test(ta)&&/days? left/i.test(ta)&&/Nobody has scored this month/.test(ta),'month board is the default and starts empty');
await A.evaluate(()=>{G.coach.titles=1;G.coach.playoffs=1;G.coach.confTitles=1;save();});await A.waitForTimeout(12500);await click(A,'[data-act="lbload"]');await A.waitForTimeout(900);
ta=await text(A);ok(/Alpha Prime/.test(ta.split(/race/i)[1]||'')&&/this month/i.test(ta),'title shows up on this month board');
ok(await A.evaluate(()=>UI.lbM&&UI.lbM.rank===1&&UI.lbM.rows[0].titles===1),'A leads the month with 1 title');
await click(A,'[data-act="lbper"][data-id="all"]');ok(/all time/i.test(await text(A)),'all-time tab');
await B.evaluate(()=>onAction('hubopen',{dataset:{id:'lb'}}));await B.waitForTimeout(900);tb=await text(B);ok(tb.includes('Alpha Prime'),'B sees A on the month leaderboard');await click(B,'[data-act="lbper"][data-id="all"]');ok((await text(B)).includes('Alpha Prime'),'B sees A all time');
await click(B,'[data-act="report"][data-n="Alpha Prime"]');ok((await text(B)).includes('Report Alpha Prime?'),'report box');
await click(B,'[data-act="reportsend"][data-id="Offensive name"]');await B.waitForTimeout(600);
ok(!(await text(B)).includes('Alpha Prime'),'reported profile blocked for reporter');
// ---------- report a league from search hides it for the reporter
await click(B,'[data-act="hub"][data-id="friends"]');await B.fill('#hubQ','thursday');await click(B,'[data-act="hubsearch"]');await B.waitForTimeout(600);
await click(B,'[data-act="report"][data-k="league"]');await click(B,'[data-act="reportsend"][data-id="Other"]');await B.waitForTimeout(500);
ok(!(await text(B)).includes('Thursday Crew'),'reported league gone for reporter');
// ---------- C takes a solo dynasty online
const C=await mk(1280,900);await C.goto('file://'+PAGE);await C.waitForTimeout(700);
await C.evaluate(()=>{onAction('quickstart',{dataset:{}});UI.tab='program';render();});await C.waitForTimeout(500);
ok((await text(C)).includes('Invite friends to this dynasty'),'host card on solo dynasty');
const wk=await C.evaluate(()=>{G.week=5;save();return G.week;});
await click(C,'[data-act="host"]');await click(C,'[data-act="rulesok"]');await click(C,'[data-act="hostyes"]');await C.waitForTimeout(2000);
ok(await C.evaluate(()=>!!(G.online&&NET&&NET.id&&G.week===5)),'solo dynasty is now online with progress kept');
ok((await text(C)).toLowerCase().includes('league code'),'invite card shown after hosting');
const errs=[...A.errs,...B.errs,...C.errs,...A2.errs];ok(!errs.length,'no page errors: '+errs.join(' | '));
console.log(fails?`${fails}/${checks} checks FAILED`:`${checks}/${checks} checks passed`);await b.close();process.exit(fails?1:0);})().catch(e=>{console.log('CRASH',e);process.exit(2);});
