/* Ink Battles: the save file, the title, camp between chapters, and every card around the battles. */
"use strict";
const SAVE_KEY='inkbattles.v1';
const BLANK=()=>({v:1,mode:'classic',ch:0,roster:[],fallen:[],tips:{},done:false});
let G=BLANK(), ROSTER=null;
function save(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(G)); }catch(e){} }
function load(){ try{ const s=localStorage.getItem(SAVE_KEY); if(!s) return false; const d=JSON.parse(s); if(!d||!d.roster||!d.roster.length) return false; G=Object.assign(BLANK(),d); return true; }catch(e){ return false; } }
const recUnit=r=>Object.assign({},r,{name:CHARS[r.id].name,charId:r.id,maxhp:r.hp,team:'ally',ref:r});
function hideBattleUI(){ $('top').hidden=true; $('dock').hidden=true; $('pause').hidden=true; $('tip').hidden=true; UI.mode='off'; }
const pips=i=>`<div class="prog" aria-label="Chapter ${i+1} of ${CHAPTERS.length}">${CHAPTERS.map((_,k)=>`<i class="${k<i?'done':k===i?'now':''}"></i>`).join('')}</div>`;
const HOW=`<div class="how"><p>Tap one of your units, then a square to move it. Then Attack, Heal, Talk, Visit or Wait.</p>
  <p>Swords beat axes, axes beat lances, lances beat swords. The winner gets +1 damage and +15 hit. Units wear their weapon: solid ink for swords, hatching for lances, dots for axes.</p>
  <p>Four more speed than your foe and you strike twice. Bows can’t hit up close but tear through fliers. Forests, hills and forts make you harder to hit.</p>
  <p>Tap an enemy to see where it can reach, or tap Danger to see everyone’s. If Wren falls, the battle is lost. On Classic, anyone else who falls is gone for good.</p></div>`;

/* ---------- title ---------- */
function home(){
  hideBattleUI(); B=null;
  const has=load();
  const next=has&&!G.done?CHAPTERS[G.ch]:null;
  card(`<canvas class="hero" id="hero"></canvas>
    <h2 class="logo">Ink Battles</h2><p>Raise a banner. Win the war. Lose no one.</p>
    ${next?`<button class="btn" id="go">Continue: Chapter ${G.ch+1}</button><button class="btn ghost" id="fresh">New campaign</button>`:`<button class="btn" id="fresh">${has?'New campaign':'Begin the campaign'}</button>`}
    <button class="btn ghost" id="how">How to play</button>
    <p class="ver">A strategy game in the Ink series. Six chapters, one life each.</p>`,{home:true});
  liveArt($('hero'),(g,w,h,t,dt,d)=>{
    const base=h*.86, S=h*.52;
    g.strokeStyle='#000'; g.lineWidth=2; g.setLineDash([3,5]); g.beginPath(); g.moveTo(w*.06,base+4); g.lineTo(w*.94,base+4); g.stroke(); g.setLineDash([]);
    // a banner behind the lord
    const bx=w*.5-S*.5, top=base-S*1.5, f=Math.sin(t*2.4);
    g.lineWidth=3; g.beginPath(); g.moveTo(bx,base); g.lineTo(bx,top); g.stroke();
    g.beginPath(); g.moveTo(bx,top+4); g.bezierCurveTo(bx+S*.3,top-4+f*4,bx+S*.5,top+10-f*4,bx+S*.72,top+4+f*3); g.lineTo(bx+S*.62,top+S*.2); g.lineTo(bx+S*.72,top+S*.4+f*3); g.bezierCurveTo(bx+S*.5,top+S*.44-f*4,bx+S*.3,top+S*.34+f*4,bx,top+S*.4); g.closePath();
    g.fillStyle='#000'; g.fill(); g.beginPath(); g.arc(bx+S*.3,top+S*.2+f*2,S*.07,0,TAU); g.fillStyle='#fff'; g.fill();
    const lunge=Math.max(0,Math.sin(t*1.3))**6;
    [[w*.2,'bram',S*.95,false,0],[w*.5,'wren',S,false,2],[w*.8,'brigand',S*.95,true,4]].forEach(([x,id,s,foe,seed],i)=>{
      g.beginPath(); g.ellipse(x,base,s*.3,s*.07,0,0,TAU);
      if(foe){ g.fillStyle='#fff'; g.fill(); g.setLineDash([3,3]); g.lineWidth=2; g.strokeStyle='#000'; g.stroke(); g.setLineDash([]); } else { g.fillStyle='#000'; g.fill(); }
      drawUnit(g,whoOf(id),x+(i===1?lunge*w*.05:0),base,s,{t,seed,foe,dpr:d,sq:i===1?-lunge*.4:0,flip:foe});
    });
  });
  if(next) $('go').onclick=()=>{ sfx('tap'); camp(); };
  $('fresh').onclick=()=>{ sfx('tap'); if(has&&!G.done) confirmNew(); else pickMode(); };
  $('how').onclick=()=>{ sfx('tap'); howCard(home); };
}
function howCard(back){
  card(`<h2>How to play</h2><p>Take turns with the enemy on a grid. Move everyone, then end your turn.</p>
    <div class="tri"><span><i class="sw"></i>Sword</span><span>beats</span><span><i class="ax"></i>Axe</span><span>beats</span><span><i class="la"></i>Lance</span></div>${HOW}
    <button class="btn" id="ok">Got it</button>`);
  $('ok').onclick=()=>{ sfx('tap'); back(); };
}
function confirmNew(){
  card(`<h2>Start over?</h2><p>Your band, their levels and your place in the story will be erased.</p>
    <div class="two"><button class="btn ghost" id="no">Keep playing</button><button class="btn" id="yes">Start over</button></div>`);
  $('no').onclick=()=>{ sfx('tap'); home(); };
  $('yes').onclick=()=>{ sfx('tap'); pickMode(); };
}
function pickMode(){
  let mode='classic';
  const draw=()=>{ card(`<h2>Choose your rules</h2><p>You can’t change this later.</p>
    <div class="modes"><button class="mode${mode==='classic'?' on':''}" data-m="classic" aria-pressed="${mode==='classic'}"><b>Classic</b><span>Anyone who falls is gone for the rest of the war. Every move matters.</span></button>
    <button class="mode${mode==='casual'?' on':''}" data-m="casual" aria-pressed="${mode==='casual'}"><b>Casual</b><span>Fallen friends sit out the rest of the chapter and come back for the next one.</span></button></div>
    <button class="btn" id="go">Begin</button><button class="btn ghost" id="back">Back</button>`,{home:true,still:draw.n++>0});
    document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>{ sfx('pick'); mode=b.dataset.m; draw(); });
    $('go').onclick=()=>{ sfx('go'); try{ localStorage.removeItem(SAVE_KEY); }catch(e){} const tips=G.tips; G=BLANK(); G.mode=mode; G.tips=tips||{}; save(); startChapter(0); };
    $('back').onclick=()=>{ sfx('tap'); home(); };
  }; draw.n=0; draw();
}

/* ---------- chapters ---------- */
async function startChapter(i){
  hideBattleUI(); B=null;
  const ch=CHAPTERS[i];
  ch.joins.forEach(id=>{ if(!G.roster.some(r=>r.id===id)&&!G.fallen.includes(id)) G.roster.push(newRecord(id)); });
  save();
  await scene(ch.intro,{title:`Chapter ${i+1} · ${ch.name}`,home:true,done:'Prepare'});
  prep(i);
}
function slotsOf(ch){ return ch.map.join('').replace(/[^1-9]/g,'').length; }
function prep(i){
  hideBattleUI(); B=null;
  const ch=CHAPTERS[i], cap=slotsOf(ch), avail=G.roster.slice();
  const pick=new Set(['wren'].concat(avail.filter(r=>r.id!=='wren').sort((a,b)=>b.lv-a.lv).map(r=>r.id)).slice(0,cap));
  const counts={}; ch.foes.filter(f=>!f.boss&&!f.char).forEach(f=>counts[f.cls]=(counts[f.cls]||0)+1);
  const extra=(ch.reinf||[]).length;
  const draw=()=>{
    card(`${pips(i)}<p class="kicker">Chapter ${i+1}</p><h2>${esc(ch.name)}</h2><p style="margin-bottom:10px">${esc(ch.place)}</p>
      <canvas class="minimap" id="mini"></canvas>
      <div class="how"><p><b>Goal:</b> ${esc(goalOf(ch))}.${ch.goal.kind!=='boss'?'':' Everyone else is optional.'} If Wren falls, the battle is lost.</p>${ch.tip?`<p>${esc(ch.tip)}</p>`:''}</div>
      <div class="rowlab"><b>The enemy</b><span>${ch.foes.length} on the map${extra?`, ${extra} more coming`:''}</span></div>
      <div class="foes">${ch.foes.filter(f=>f.boss).map(f=>`<div class="foe boss">${who(f.cls,1)}${esc(f.boss.name.replace(/^The /,''))}</div>`).join('')}
        ${ch.foes.filter(f=>f.char).map(f=>`<div class="foe">${who(f.char,1)}${esc(CHARS[f.char].name)}</div>`).join('')}
        ${Object.entries(counts).map(([c,n])=>`<div class="foe">${who(c,1)}${esc(CLASSES[c].name.split(' ')[0])}${n>1?' ×'+n:''}</div>`).join('')}</div>
      <div class="rowlab"><b>Your band</b><span>${pick.size} of ${Math.min(cap,avail.length)} deployed</span></div>
      <div class="carpick">${avail.map(r=>`<button class="cp${pick.has(r.id)?' on':''}${r.id==='wren'?' lock':''}" data-id="${r.id}" aria-pressed="${pick.has(r.id)}">${who(r.id)}${esc(CHARS[r.id].name)}<small>Lv ${r.lv} ${esc(CLASSES[r.cls].name.split(' ')[0])}</small></button>`).join('')}</div>
      <button class="btn" id="start">Start the battle</button><button class="btn ghost" id="back">${i===0&&!G.fallen.length&&G.roster.length<=3?'Title screen':'Back to camp'}</button>`,{home:true,still:draw.n++>0});
    miniMap($('mini'),ch);
    document.querySelectorAll('.cp').forEach(b=>b.onclick=()=>{ const id=b.dataset.id;
      if(id==='wren'){ b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); sfx('nope'); return; }
      if(pick.has(id)) pick.delete(id); else if(pick.size<cap) pick.add(id); else { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); sfx('nope'); return; }
      sfx('pick'); draw(); });
    $('start').onclick=()=>{ sfx('go'); startBattle(i,[...pick].sort((a,b)=>(a==='wren'?-1:b==='wren'?1:0))); };
    $('back').onclick=()=>{ sfx('tap'); if(G.ch===0&&G.roster.length<=3) home(); else camp(); };
  }; draw.n=0; draw();
}
function goalOf(ch){ const g=ch.goal; return g.kind==='survive'?`Survive ${g.turns} turns`:g.kind==='seize'?`Move Wren onto the ${ch.map.join('').includes('G')?'gate':'throne'} and seize it`:g.kind==='boss'?`Defeat ${ch.foes.find(f=>f.boss).boss.name}`:'Defeat every enemy'; }
function miniMap(c,ch){
  const d=Math.min(2,window.devicePixelRatio||1), w=c.clientWidth, h=c.clientHeight; c.width=Math.round(w*d); c.height=Math.round(h*d);
  const g=c.getContext('2d'); g.setTransform(d,0,0,d,0,0); const cs=w/8;
  ch.map.forEach((row,y)=>[...row].forEach((k,x)=>{ const X=x*cs, Y=y*cs;
    if(k==='W'){ g.fillStyle='#000'; g.fillRect(X,Y,cs+.5,cs+.5); }
    else if(k==='~'){ g.fillStyle=patIn(g,'hatch',d*.35); g.globalAlpha=.5; g.fillRect(X,Y,cs,cs); g.globalAlpha=1; }
    else if(k==='f'||k==='m'||k==='c'){ g.beginPath(); g.arc(X+cs/2,Y+cs/2,cs*.26,0,TAU); g.lineWidth=1.3; g.strokeStyle='#000'; g.stroke(); if(k==='m'){ g.fillStyle='#000'; g.fill(); } }
    else if(/[FTGv]/.test(k)){ g.beginPath(); g.rect(X+cs*.22,Y+cs*.22,cs*.56,cs*.56); g.lineWidth=1.6; g.strokeStyle='#000'; g.stroke(); if(k!=='v'){ g.fillStyle='#000'; g.fill(); } }
    else if(/[1-9]/.test(k)){ g.beginPath(); g.arc(X+cs/2,Y+cs/2,cs*.2,0,TAU); g.fillStyle='#000'; g.fill(); } }));
  ch.foes.forEach(f=>{ g.beginPath(); g.arc((f.x+.5)*cs,(f.y+.5)*cs,cs*(f.boss?.3:.22),0,TAU); g.fillStyle='#fff'; g.fill(); g.setLineDash([2,2]); g.lineWidth=1.6; g.strokeStyle='#000'; g.stroke(); g.setLineDash([]); if(f.boss){ g.beginPath(); g.arc((f.x+.5)*cs,(f.y+.5)*cs,cs*.1,0,TAU); g.fillStyle='#000'; g.fill(); } });
}

/* ---------- a battle ---------- */
function startBattle(i,ids){
  CH=CHAPTERS[i]; BOX.set=0;
  // fight with a copy of the band so a loss or a retreat changes nothing
  ROSTER=JSON.parse(JSON.stringify(G.roster));
  B=makeBattle(CH,ROSTER,ids); B.chIndex=i; B.fallen=[]; B.recruits=[]; B.levels=[]; B.gifts=[]; B.razed=0;
  B.units.forEach(u=>{ u.vx=u.x; u.vy=u.y; u.seed=Math.random()*10; });
  seedBoard(); closeCard(); $('top').hidden=false; $('dock').hidden=false; $('pause').hidden=false;
  UI.mode='idle'; UI.sel=null; UI.info=null; UI.danger=null; UI.dangerAll=false; dirty();
  hud(); dockIdle(); layout();
  callout('Player phase',goalOf(CH));
  if(CH.id==='c1') setTimeout(()=>tip('sel','Tap Wren to see every square in reach.'),1300);
  if(CH.tip) setTimeout(()=>tip('ch_'+CH.id,CH.tip),1400);
}
function endBattle(o){
  hideBattleUI();
  const win=o==='win', i=B.chIndex, last=i===CHAPTERS.length-1;
  const lord=B.units.find(u=>u.charId==='wren');
  if(win){
    // keep the levels and gifts from this battle, and anyone who joined
    B.units.filter(u=>u.team==='ally'&&u.ref&&B.recruits.includes(u.charId)).forEach(u=>{ if(!ROSTER.some(r=>r.id===u.charId)&&(u.hp>0||G.mode==='casual')) ROSTER.push(u.ref); });
    G.roster=ROSTER.filter(r=>G.mode==='casual'||!B.fallen.includes(r.id));
    if(G.mode==='classic') B.fallen.forEach(id=>{ if(!G.fallen.includes(id)) G.fallen.push(id); });
    G.ch=i+1; if(last) G.done=true; save();
    sfx('win');
    card(`${pips(i+1<CHAPTERS.length?i+1:i)}<canvas id="resart" style="width:100%;height:120px"></canvas>
      <h2>Chapter clear</h2><p>${esc(CH.name)} in ${B.turn} turn${B.turn===1?'':'s'}.</p>
      ${B.recruits.length?`<div class="won"><b>Joined your band</b><span>${B.recruits.map(id=>CHARS[id].name).join(', ')}</span></div>`:''}
      ${B.levels.length?`<div class="won"><b>Leveled up</b><span>${B.levels.join(', ')}</span></div>`:''}
      ${B.gifts.length?`<div class="won"><b>Gifts from villages</b><span>${B.gifts.join(', ')}</span></div>`:''}
      ${B.razed?`<div class="won"><b>Villages burned</b><span>${B.razed}</span></div>`:''}
      ${B.fallen.length?`<div class="won"><b>${G.mode==='casual'?'Wounded, back next chapter':'Fallen'}</b><span>${B.fallen.map(id=>CHARS[id].name).join(', ')}</span></div>`:''}
      <button class="btn" id="ok">${last?'Epilogue':'To camp'}</button>`,{home:true});
    const cast=alive(B,'ally').slice(0,3);
    liveArt($('resart'),(g,w,h,t,dt,d)=>{ cast.forEach((u,k)=>{ const x=w/2+(k-(cast.length-1)/2)*h*.85, j=Math.abs(Math.sin(t*3.2+k))*h*.1;
      g.beginPath(); g.ellipse(x,h*.92,h*.18,h*.04,0,0,TAU); g.fillStyle='#000'; g.fill(); drawUnit(g,u,x,h*.92-j,h*.62,{t,seed:k,dpr:d,sq:j<2?.3:-.1}); }); });
    $('ok').onclick=()=>{ sfx('tap'); if(last) ending(); else camp(); };
  } else {
    sfx('lose');
    card(`<canvas id="resart" style="width:100%;height:110px"></canvas><h2>Defeat</h2>
      <div class="quote">${esc(CHARS.wren.death)}<small>Wren</small></div>
      <p>Wren has fallen. Nothing from this battle is kept. Try the chapter again with what you learned.</p>
      <button class="btn" id="retry">Try again</button><button class="btn ghost" id="ok">To camp</button>`,{home:true});
    liveArt($('resart'),(g,w,h,t,dt,d)=>{ g.beginPath(); g.ellipse(w/2,h*.92,h*.2,h*.04,0,0,TAU); g.fillStyle='#000'; g.fill(); drawUnit(g,lord,w/2,h*.92,h*.62,{t,seed:1,dpr:d,sq:.3}); });
    $('retry').onclick=()=>{ sfx('tap'); prep(i); };
    $('ok').onclick=()=>{ sfx('tap'); camp(); };
  }
}

/* ---------- camp ---------- */
function camp(){
  hideBattleUI(); B=null;
  if(G.done) return ending();
  const i=G.ch, ch=CHAPTERS[i];
  card(`${pips(i)}<h2>Camp</h2><p>${i===0?'Before the first battle.':`${i} chapter${i>1?'s':''} behind you. ${CHAPTERS.length-i} to go.`} ${G.mode==='classic'?'Classic rules.':'Casual rules.'}</p>
    <div class="rowlab"><b>Your band</b><span>${G.roster.length}</span></div>
    <div class="gl">${G.roster.map((r,k)=>`<button class="srow" data-id="${r.id}" style="animation-delay:${k*.04}s">${who(r.id)}<div class="sinfo"><b>${esc(CHARS[r.id].name)}</b><small>${esc(CLASSES[r.cls].name)} · ${esc(WEAPONS[r.wpn].name)}</small></div><div class="tagx">Lv ${r.lv}<small>${r.xp} exp · ${r.hp} HP</small></div></button>`).join('')}
      ${G.fallen.map(id=>`<div class="srow gone">${who(id)}<div class="sinfo"><b>${esc(CHARS[id].name)}</b><small>Fallen</small></div><div></div></div>`).join('')}</div>
    <button class="btn" id="next">Chapter ${i+1}: ${esc(ch.name)}</button><button class="btn ghost" id="how">How to play</button><button class="btn ghost" id="quit">Title screen</button>`,{home:true});
  document.querySelectorAll('.srow[data-id]').forEach(b=>b.onclick=()=>{ sfx('tap'); const r=G.roster.find(q=>q.id===b.dataset.id); rosterCard(r); });
  $('next').onclick=()=>{ sfx('go'); startChapter(i); };
  $('how').onclick=()=>{ sfx('tap'); howCard(camp); };
  $('quit').onclick=()=>{ sfx('tap'); home(); };
}
function rosterCard(r){
  const u=recUnit(r), w=WEAPONS[r.wpn];
  const bar=k=>`<div>${STAT_NAME[k]}</div><div class="sb"><i style="width:${Math.round(Math.min(1,r[k]/(k==='hp'?60:30))*100)}%"></i></div><div class="n">${r[k]}</div>`;
  card(`<div class="stage"><canvas id="stat"></canvas></div><h2>${esc(u.name)}</h2><p style="margin-bottom:10px">Level ${r.lv} ${CLASSES[r.cls].name} · ${r.xp} exp</p>
    <div class="stats">${STATS.map(bar).join('')}</div>
    <div class="how"><p><b>${w.name}</b> · ${KINDS[w.kind].name}${w.kind==='staff'?`, heals ${w.heal+r.mag}`:`, might ${w.mt}, hit ${w.hit}${w.crt?', crit '+w.crt:''}`}${w.note?'. '+w.note:''}.</p><p>${esc(CHARS[r.id].bio)}</p></div>
    <button class="btn" id="ok">Back to camp</button>`,{home:true});
  liveArt($('stat'),(g,wd,h,t,dt,d)=>{ g.beginPath(); g.ellipse(wd/2,h*.88,h*.22,h*.05,0,0,TAU); g.fillStyle='#000'; g.fill(); drawUnit(g,u,wd/2,h*.88,h*.66,{t,seed:2,dpr:d}); });
  $('ok').onclick=()=>{ sfx('tap'); camp(); };
}
async function ending(){
  hideBattleUI(); B=null;
  if(!ending.seen){ ending.seen=true; await scene(EPILOGUE,{title:'Epilogue',home:true,done:'The end'}); }
  const band=G.roster.map(r=>r.id);
  card(`<canvas id="endart" style="width:100%;height:150px"></canvas><h2>The banners are white</h2>
    <p>The Smudge King is gone, and the ink runs clear again.</p>
    <div class="won"><b>Stood with Wren at the end</b><span>${band.map(id=>CHARS[id].name).join(', ')}</span></div>
    ${G.fallen.length?`<div class="won"><b>Remembered</b><span>${G.fallen.map(id=>CHARS[id].name).join(', ')}</span></div>`:`<div class="won"><b>Nobody was lost</b><span>Everyone came home.</span></div>`}
    <button class="btn" id="again">New campaign</button><button class="btn ghost" id="ok">Title screen</button>`,{home:true});
  const cast=band.slice(0,5);
  liveArt($('endart'),(g,w,h,t,dt,d)=>{ cast.forEach((id,k)=>{ const x=w/2+(k-(cast.length-1)/2)*Math.min(h*.62,w/(cast.length+.5)), j=Math.abs(Math.sin(t*3+k*.7))*h*.08;
    g.beginPath(); g.ellipse(x,h*.9,h*.14,h*.035,0,0,TAU); g.fillStyle='#000'; g.fill(); drawUnit(g,whoOf(id),x,h*.9-j,h*.5,{t,seed:k,dpr:d,sq:j<2?.25:-.1}); }); });
  $('again').onclick=()=>{ sfx('tap'); pickMode(); };
  $('ok').onclick=()=>{ sfx('tap'); home(); };
}
function pauseMenu(){
  if(!B||UI.mode==='busy'||UI.mode==='enemy'||!$('card').hidden) return;
  const prev=UI.mode; UI.mode='off';
  card(`<h2>Paused</h2><p>${esc(CH.name)}, turn ${B.turn}. ${esc(goalOf(CH))}.</p>${HOW}
    <button class="btn" id="res">Resume</button><button class="btn ghost" id="restart">Restart chapter</button><button class="btn ghost" id="ret">Retreat to camp</button>`);
  $('res').onclick=()=>{ sfx('tap'); closeCard(); UI.mode=prev==='off'?'idle':prev; };
  $('restart').onclick=()=>{ sfx('tap'); prep(B.chIndex); };
  $('ret').onclick=()=>{ sfx('tap'); camp(); };
}
$('pause').onclick=()=>{ sfx('tap'); pauseMenu(); };

/* ---------- start-up ---------- */
addEventListener('resize',resize); resize(); makePats();
requestAnimationFrame(frame);
(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(()=>home());
