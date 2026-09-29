/* Ink Battles: the rules. Pure logic, no drawing, so it can be tested on its own. */
"use strict";
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const STATS=['hp','str','mag','skl','spd','lck','def','res'];
const STAT_NAME={hp:'HP',str:'Strength',mag:'Magic',skl:'Skill',spd:'Speed',lck:'Luck',def:'Defense',res:'Resistance'};
const CAP={hp:60,str:30,mag:30,skl:30,spd:30,lck:30,def:30,res:30};
const MAX_LV=20;

/* ---------- weapons ---------- */
// sword beats axe, axe beats lance, lance beats sword
const KINDS={sword:{name:'Sword',beats:'axe'},axe:{name:'Axe',beats:'lance'},lance:{name:'Lance',beats:'sword'},bow:{name:'Bow'},tome:{name:'Tome'},staff:{name:'Staff'}};
const WEAPONS={
  quill:{name:'Quill Blade',kind:'sword',mt:6,hit:95,crt:10,rng:[1,1],eff:['armor','horse'],note:'Triple might against armor and horses'},
  sword:{name:'Iron Sword',kind:'sword',mt:5,hit:90,crt:0,rng:[1,1]},
  killer:{name:'Killing Edge',kind:'sword',mt:8,hit:80,crt:30,rng:[1,1]},
  lance:{name:'Iron Lance',kind:'lance',mt:7,hit:80,crt:0,rng:[1,1]},
  javelin:{name:'Javelin',kind:'lance',mt:6,hit:65,crt:0,rng:[1,2]},
  axe:{name:'Iron Axe',kind:'axe',mt:8,hit:75,crt:0,rng:[1,1]},
  handaxe:{name:'Hand Axe',kind:'axe',mt:7,hit:60,crt:0,rng:[1,2]},
  steelaxe:{name:'Steel Axe',kind:'axe',mt:11,hit:65,crt:0,rng:[1,1]},
  bow:{name:'Iron Bow',kind:'bow',mt:6,hit:85,crt:0,rng:[2,2],eff:['fly'],note:'Triple might against fliers'},
  fire:{name:'Fire',kind:'tome',mt:5,hit:90,crt:0,rng:[1,2],magic:true},
  thunder:{name:'Thunder',kind:'tome',mt:8,hit:80,crt:5,rng:[1,2],magic:true},
  blot:{name:'Blot',kind:'tome',mt:8,hit:85,crt:5,rng:[1,2],magic:true},
  heal:{name:'Heal',kind:'staff',heal:10,rng:[1,1]}
};

/* ---------- classes ---------- */
const CLASSES={
  lord:{name:'Lord',move:'foot',mov:5,tags:[],wpn:'quill',base:{hp:18,str:5,mag:1,skl:6,spd:7,lck:6,def:4,res:2},grow:{hp:80,str:45,mag:10,skl:50,spd:50,lck:45,def:25,res:20}},
  merc:{name:'Mercenary',move:'foot',mov:5,tags:[],wpn:'sword',base:{hp:18,str:4,mag:0,skl:6,spd:7,lck:2,def:3,res:0},grow:{hp:75,str:40,skl:50,spd:50,lck:25,def:20,res:15}},
  fighter:{name:'Fighter',move:'foot',mov:5,tags:[],wpn:'axe',base:{hp:21,str:6,mag:0,skl:2,spd:4,lck:0,def:2,res:0},grow:{hp:85,str:55,skl:30,spd:30,lck:20,def:15,res:5}},
  brigand:{name:'Brigand',move:'foot',mov:5,tags:[],wpn:'axe',base:{hp:20,str:5,mag:0,skl:1,spd:3,lck:0,def:2,res:0},grow:{hp:85,str:50,skl:25,spd:25,lck:10,def:15,res:5}},
  soldier:{name:'Soldier',move:'foot',mov:5,tags:[],wpn:'lance',base:{hp:17,str:4,mag:0,skl:3,spd:3,lck:0,def:4,res:0},grow:{hp:75,str:40,skl:35,spd:30,lck:20,def:25,res:10}},
  knight:{name:'Knight',move:'armor',mov:4,tags:['armor'],wpn:'lance',base:{hp:20,str:6,mag:0,skl:3,spd:1,lck:1,def:9,res:0},grow:{hp:85,str:45,skl:35,spd:15,lck:20,def:50,res:10}},
  general:{name:'General',move:'armor',mov:4,tags:['armor'],wpn:'lance',base:{hp:26,str:9,mag:0,skl:6,spd:3,lck:2,def:13,res:3},grow:{hp:85,str:45,skl:35,spd:20,lck:20,def:45,res:15}},
  cav:{name:'Cavalier',move:'horse',mov:7,tags:['horse'],wpn:'lance',base:{hp:19,str:5,mag:0,skl:5,spd:6,lck:2,def:5,res:1},grow:{hp:75,str:40,skl:40,spd:40,lck:30,def:25,res:15}},
  archer:{name:'Archer',move:'foot',mov:5,tags:[],wpn:'bow',base:{hp:16,str:4,mag:0,skl:6,spd:5,lck:2,def:2,res:1},grow:{hp:65,str:40,skl:55,spd:45,lck:30,def:20,res:15}},
  mage:{name:'Mage',move:'foot',mov:5,tags:[],wpn:'fire',base:{hp:15,str:0,mag:5,skl:4,spd:5,lck:2,def:1,res:5},grow:{hp:55,mag:55,skl:40,spd:45,lck:30,def:10,res:40}},
  cleric:{name:'Cleric',move:'foot',mov:5,tags:[],wpn:'heal',base:{hp:15,str:0,mag:4,skl:3,spd:5,lck:6,def:1,res:6},grow:{hp:50,mag:50,skl:30,spd:40,lck:45,def:10,res:50}},
  peg:{name:'Pegasus Knight',move:'fly',mov:7,tags:['fly'],wpn:'lance',base:{hp:16,str:4,mag:0,skl:6,spd:9,lck:5,def:3,res:6},grow:{hp:55,str:35,skl:45,spd:55,lck:45,def:15,res:35}},
  sorc:{name:'Sorcerer',move:'foot',mov:5,tags:[],wpn:'blot',base:{hp:22,str:0,mag:8,skl:6,spd:6,lck:3,def:4,res:8},grow:{hp:70,mag:50,skl:40,spd:35,lck:25,def:20,res:45}}
};

/* ---------- your band ---------- */
const CHARS={
  wren:{name:'Wren',cls:'lord',lv:1,look:{hair:'spike'},stats:{hp:19,str:5,mag:1,skl:6,spd:7,lck:6,def:4,res:2},grow:{hp:80,str:45,mag:10,skl:50,spd:50,lck:45,def:25,res:20},
    bio:'Heir to Vellum, the town of quills. Young and stubborn. If Wren falls, the war is lost.',death:'I’m sorry, everyone. I couldn’t…'},
  bram:{name:'Bram',cls:'knight',lv:2,look:{beard:1},stats:{hp:23,str:7,mag:0,skl:4,spd:2,lck:2,def:10,res:1},grow:{hp:85,str:45,mag:0,skl:35,spd:15,lck:25,def:50,res:10},
    bio:'Vellum’s gate guard for twenty years. Slow as a cart, hard as its wheels.',death:'Sorry, Wren. Hold the line without me.'},
  maud:{name:'Maud',cls:'cleric',lv:1,look:{glasses:1},stats:{hp:16,str:0,mag:5,skl:3,spd:5,lck:7,def:1,res:6},grow:{hp:45,str:0,mag:55,skl:30,spd:40,lck:45,def:10,res:55},
    bio:'The town cleric. Mends cuts, scolds lords, reads by candlelight.',death:'Don’t stop to pray for me. Go.'},
  tess:{name:'Tess',cls:'cav',lv:3,look:{pony:1},stats:{hp:21,str:6,mag:0,skl:6,spd:7,lck:4,def:5,res:1},grow:{hp:70,str:40,mag:0,skl:45,spd:45,lck:30,def:25,res:15},
    bio:'A rider of the fallen capital. Rode three days without sleep to warn the south.',death:'Get my horse home. Please.'},
  pim:{name:'Pim',cls:'archer',lv:3,look:{freckles:1},stats:{hp:18,str:5,mag:0,skl:7,spd:6,lck:3,def:3,res:1},grow:{hp:60,str:40,mag:0,skl:55,spd:45,lck:35,def:20,res:15},
    bio:'A poacher turned archer. Swears every shot is luck. It is not.',death:'Missed. Just the once.'},
  oda:{name:'Oda',cls:'fighter',lv:4,look:{beard:1},stats:{hp:28,str:8,mag:0,skl:4,spd:5,lck:3,def:3,res:0},grow:{hp:90,str:55,mag:0,skl:30,spd:35,lck:25,def:20,res:10},
    bio:'A hill woodcutter who swings an axe like he has a grudge against trees.',death:'Heh. Better than the hills…'},
  cass:{name:'Cass',cls:'merc',lv:5,look:{long:1},stats:{hp:23,str:7,mag:0,skl:10,spd:11,lck:4,def:4,res:1},grow:{hp:70,str:40,mag:0,skl:55,spd:55,lck:30,def:20,res:20},
    bio:'A sword for hire, now hired by a promise. Fast, quiet, hard to hit.',death:'Bad deal after all.'},
  lune:{name:'Lune',cls:'mage',lv:4,look:{bob:1},stats:{hp:17,str:0,mag:7,skl:6,spd:7,lck:4,def:2,res:6},grow:{hp:50,str:0,mag:60,skl:40,spd:50,lck:35,def:15,res:40},
    bio:'A student of fire tomes. Has set the library on fire twice, on purpose once.',death:'Oh. The ink is cold.'},
  kes:{name:'Kestrel',cls:'peg',lv:5,look:{bob:1},stats:{hp:19,str:6,mag:0,skl:8,spd:11,lck:7,def:4,res:7},grow:{hp:55,str:35,mag:0,skl:45,spd:60,lck:50,def:15,res:35},
    bio:'Captain of the lake watch. Flies over water and walls. Keep her away from bows.',death:'Tell the watch I flew.'}
};
function newRecord(id){ const c=CHARS[id]; return Object.assign({id,cls:c.cls,lv:c.lv,xp:0,wpn:CLASSES[c.cls].wpn},JSON.parse(JSON.stringify(c.stats))); }
function growOf(u){ return (CHARS[u.charId||u.id]||{}).grow||CLASSES[u.cls].grow; }
function statsAt(cls,lv){ const c=CLASSES[cls], o={}; STATS.forEach(k=>o[k]=c.base[k]+Math.round((c.grow[k]||0)/100*(lv-1))); return o; }
// one level: each stat rolls against its growth. A level never comes up empty.
function levelUp(r,rng=Math.random){
  const g=growOf(r), gain={};
  STATS.forEach(k=>gain[k]=r[k]<CAP[k]&&rng()*100<(g[k]||0)?1:0);
  if(!STATS.some(k=>gain[k])){ const top=STATS.filter(k=>r[k]<CAP[k]).sort((a,b)=>(g[b]||0)-(g[a]||0))[0]; if(top) gain[top]=1; }
  r.lv++; STATS.forEach(k=>r[k]+=gain[k]);
  return gain;
}

/* ---------- terrain ---------- */
const TERRAIN={
  '.':{name:'Plain',avo:0,def:0},
  'f':{name:'Forest',avo:20,def:1},
  'm':{name:'Hill',avo:30,def:2},
  '#':{name:'Cliff',avo:0,def:0},
  '~':{name:'Water',avo:0,def:0},
  'W':{name:'Wall',avo:0,def:0},
  'F':{name:'Fort',avo:20,def:2,heal:20},
  'T':{name:'Throne',avo:30,def:3,heal:20},
  'G':{name:'Gate',avo:30,def:3,heal:20},
  'v':{name:'Village',avo:10,def:0},
  'V':{name:'Village',avo:10,def:0},
  'x':{name:'Ruins',avo:10,def:0},
  'b':{name:'Bridge',avo:0,def:0},
  'c':{name:'Pillar',avo:20,def:1}
};
const terr=ch=>TERRAIN[ch]||TERRAIN['.'];
function moveCost(move,ch){
  if(ch==='W') return Infinity;
  if(move==='fly') return 1;
  if(ch==='#'||ch==='~') return Infinity;
  if(ch==='m') return move==='foot'?3:Infinity;
  if(ch==='f'||ch==='c') return move==='horse'?3:2;
  if(ch==='F') return 2;
  return 1;
}

/* ---------- a battle ---------- */
function makeUnit(o){
  const c=CLASSES[o.cls];
  return Object.assign({wpn:c.wpn,acted:false,ai:null,boss:null},o,{maxhp:o.hp});
}
function makeBattle(ch,roster,deploy){
  const map=ch.map.map(r=>r.split('')), h=map.length, w=map[0].length;
  const B={map,w,h,units:[],turn:1,goal:ch.goal,tonics:3,phase:'player',reinf:(ch.reinf||[]).slice(),villages:Object.assign({},ch.villages||{}),talks:[]};
  const slots=[]; for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(/[1-9]/.test(map[y][x])){ slots.push({n:+map[y][x],x,y}); map[y][x]='.'; }
  slots.sort((a,b)=>a.n-b.n);
  deploy.forEach((id,i)=>{ const r=roster.find(q=>q.id===id), s=slots[i]; if(!r||!s) return;
    const st={}; STATS.forEach(k=>st[k]=r[k]);
    B.units.push(makeUnit(Object.assign({id:'a_'+id,charId:id,ref:r,name:CHARS[id].name,cls:r.cls,lv:r.lv,xp:r.xp,wpn:r.wpn,team:'ally',x:s.x,y:s.y},st))); });
  ch.foes.forEach((f,i)=>B.units.push(foeUnit(f,'e'+i)));
  return B;
}
function foeUnit(f,id){
  const st=f.char?Object.assign({},CHARS[f.char].stats):statsAt(f.cls,f.lv);
  if(f.boss&&f.boss.add) STATS.forEach(k=>st[k]+=(f.boss.add[k]||0));
  return makeUnit(Object.assign({id,name:f.char?CHARS[f.char].name:(f.boss?f.boss.name:CLASSES[f.cls].name),cls:f.cls,lv:f.char?CHARS[f.char].lv:f.lv,wpn:f.w||CLASSES[f.cls].wpn,team:'enemy',x:f.x,y:f.y,ai:f.ai||null,boss:f.boss||null,talk:f.talk||null,charId:f.char||null},st));
}
function inb(B,x,y){ return x>=0&&y>=0&&x<B.w&&y<B.h; }
function tAt(B,x,y){ return B.map[y][x]; }
function unitAt(B,x,y){ return B.units.find(u=>u.hp>0&&u.x===x&&u.y===y); }
function alive(B,team){ return B.units.filter(u=>u.hp>0&&(!team||u.team===team)); }
const key=(x,y)=>x+','+y;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const wOf=u=>WEAPONS[u.wpn];
const movOf=u=>CLASSES[u.cls].mov;
// every square a unit can reach this turn; friends can be passed through, foes can't
function reach(B,u){
  const move=CLASSES[u.cls].move, all=new Map(), open=[{x:u.x,y:u.y,c:0}];
  all.set(key(u.x,u.y),{x:u.x,y:u.y,c:0,prev:null});
  while(open.length){
    let bi=0; for(let i=1;i<open.length;i++) if(open[i].c<open[bi].c) bi=i;
    const cur=open.splice(bi,1)[0]; if(cur.c>all.get(key(cur.x,cur.y)).c) continue;
    for(const [dx,dy] of DIRS){ const nx=cur.x+dx, ny=cur.y+dy; if(!inb(B,nx,ny)) continue;
      const nc=cur.c+moveCost(move,tAt(B,nx,ny)); if(nc>movOf(u)) continue;
      const o=unitAt(B,nx,ny); if(o&&o.team!==u.team) continue;
      const k=key(nx,ny), have=all.get(k); if(have&&have.c<=nc) continue;
      all.set(k,{x:nx,y:ny,c:nc,prev:key(cur.x,cur.y)}); open.push({x:nx,y:ny,c:nc}); }
  }
  const ends=[]; all.forEach(v=>{ const o=unitAt(B,v.x,v.y); if(!o||o===u) ends.push(v); });
  return {all,ends};
}
function pathTo(R,x,y){ const out=[]; let k=key(x,y); while(k){ const n=R.all.get(k); if(!n) break; out.unshift({x:n.x,y:n.y}); k=n.prev; } return out; }

/* ---------- combat ---------- */
function canHit(u,d){ const w=wOf(u); return w.kind!=='staff'&&d>=w.rng[0]&&d<=w.rng[1]; }
function tri(a,d){ const ka=wOf(a).kind, kd=wOf(d).kind; if(KINDS[ka].beats&&KINDS[ka].beats===kd) return 1; if(KINDS[kd].beats&&KINDS[kd].beats===ka) return -1; return 0; }
function isEff(a,d){ const w=wOf(a); return !!(w.eff&&w.eff.some(t=>CLASSES[d.cls].tags.includes(t))); }
function strike(B,a,d){
  const w=wOf(a), td=terr(tAt(B,d.x,d.y)), t=tri(a,d), eff=isEff(a,d);
  const pow=(w.magic?a.mag:a.str)+(w.mt+t)*(eff?3:1), prot=(w.magic?d.res:d.def)+td.def;
  return {dmg:Math.max(0,pow-prot),
    hit:clamp(w.hit+a.skl*2+Math.floor(a.lck/2)+t*15-(d.spd*2+d.lck+td.avo),0,100),
    crt:clamp((w.crt||0)+Math.floor(a.skl/2)-d.lck,0,100),tri:t,eff};
}
// what happens if a attacks d while standing at (ax,ay)
function forecast(B,a,d,ax,ay){
  const g=Object.assign({},a,{x:ax,y:ay}), dd=dist(g,d);
  const A=strike(B,g,d); A.x2=a.spd>=d.spd+4;
  let D=null; if(canHit(d,dd)){ D=strike(B,d,g); D.x2=d.spd>=a.spd+4; }
  return {A,D};
}
// hits use two rolls averaged, so high odds land more often and low odds less
const roll2=rng=>(rng()*100+rng()*100)/2;
function resolve(B,a,d,rng=Math.random){
  const f=forecast(B,a,d,a.x,a.y), order=['a'];
  if(f.D) order.push('d');
  if(f.A.x2) order.push('a'); else if(f.D&&f.D.x2) order.push('d');
  const seq=[];
  for(const who of order){
    const s=who==='a'?a:d, t=who==='a'?d:a, st=who==='a'?f.A:f.D;
    if(s.hp<=0||t.hp<=0) break;
    const hit=roll2(rng)<st.hit, crit=hit&&rng()*100<st.crt;
    const dmg=hit?Math.min(t.hp,st.dmg*(crit?3:1)):0; t.hp-=dmg;
    seq.push({who,hit,crit,dmg,kill:t.hp<=0});
  }
  return seq;
}
function healAmt(u){ return WEAPONS[u.wpn].heal+u.mag; }
const TONIC=10;
// experience for one of your units after a fight
function expFor(u,foe,dealt,killed){
  if(u.team!=='ally'||u.lv>=MAX_LV) return 0;
  const gap=foe.lv-u.lv;
  if(killed) return clamp(20+gap*3+(foe.boss?40:0),5,100);
  if(dealt>0) return clamp(10+gap,2,30);
  return 1;
}
const HEAL_EXP=12;

function outcome(B){
  const lord=B.units.find(u=>u.charId==='wren'&&u.team==='ally'); if(!lord||lord.hp<=0) return 'lose';
  const g=B.goal;
  if(g.kind==='boss'){ const b=B.units.find(u=>u.boss&&u.team==='enemy'); if(!b||b.hp<=0) return 'win'; }
  if(g.kind==='seize'&&B.seized) return 'win';
  if(!alive(B,'enemy').length&&!B.reinf.length) return 'win';
  return null;
}
// units that arrive at the start of the enemy phase this turn
function dueReinf(B){
  const now=B.reinf.filter(r=>r.turn===B.turn); B.reinf=B.reinf.filter(r=>r.turn!==B.turn);
  const out=[];
  now.forEach((r,i)=>{ let spot=null;
    for(let d=0;d<4&&!spot;d++) for(let y=0;y<B.h&&!spot;y++) for(let x=0;x<B.w&&!spot;x++){
      if(Math.abs(x-r.x)+Math.abs(y-r.y)!==d||unitAt(B,x,y)) continue; if(isFinite(moveCost(CLASSES[r.cls].move,tAt(B,x,y)))) spot={x,y}; }
    if(!spot) return; const u=foeUnit(Object.assign({},r,spot),'r'+B.turn+'_'+i); u.fresh=true; B.units.push(u); out.push(u); });
  return out;
}
// forts and thrones mend whoever stands on them at the start of their side's phase
function terrainHeal(B,team){
  const out=[];
  alive(B,team).forEach(u=>{ const t=terr(tAt(B,u.x,u.y)); if(t.heal&&u.hp<u.maxhp){ const h=Math.min(u.maxhp-u.hp,Math.max(1,Math.round(u.maxhp*t.heal/100))); u.hp+=h; out.push({u,h}); } });
  return out;
}

// every square a unit could hit next turn
function threat(B,u){
  const out=new Set(); if(wOf(u).kind==='staff') return out;
  const R=u.ai==='hold'?{ends:[{x:u.x,y:u.y}]}:reach(B,u), r=wOf(u).rng;
  R.ends.forEach(e=>{ for(let dy=-r[1];dy<=r[1];dy++) for(let dx=-r[1];dx<=r[1];dx++){ const d=Math.abs(dx)+Math.abs(dy); if(d<r[0]||d>r[1]) continue; const x=e.x+dx,y=e.y+dy; if(inb(B,x,y)) out.add(key(x,y)); } });
  return out;
}

/* ---------- enemy brains ---------- */
// distance, in movement cost, from every square to the nearest target square
function field(B,u,targets){
  const move=CLASSES[u.cls].move, D=new Map(), open=[];
  targets.forEach(o=>{ D.set(key(o.x,o.y),0); open.push({x:o.x,y:o.y,c:0}); });
  while(open.length){
    let bi=0; for(let i=1;i<open.length;i++) if(open[i].c<open[bi].c) bi=i;
    const cur=open.splice(bi,1)[0];
    for(const [dx,dy] of DIRS){ const nx=cur.x+dx, ny=cur.y+dy; if(!inb(B,nx,ny)) continue;
      const step=moveCost(move,tAt(B,nx,ny)); if(!isFinite(step)) continue;
      const nc=cur.c+step, k=key(nx,ny); if(D.has(k)&&D.get(k)<=nc) continue; D.set(k,nc); open.push({x:nx,y:ny,c:nc}); }
  }
  return D;
}
function plan(B,u){
  const R=u.ai==='hold'?{all:new Map([[key(u.x,u.y),{x:u.x,y:u.y,c:0,prev:null}]]),ends:[{x:u.x,y:u.y,c:0}]}:reach(B,u);
  const foes=alive(B).filter(o=>o.team!==u.team), friends=alive(B,u.team);
  const stay={path:[{x:u.x,y:u.y}],x:u.x,y:u.y,target:null};
  // healers mend the most hurt friend they can reach, and otherwise hang back
  if(wOf(u).kind==='staff'){
    let best=null;
    for(const e of R.ends) for(const f of friends){ if(f===u||f.hp>=f.maxhp||dist(e,f)!==1) continue;
      const s=(f.maxhp-f.hp)+(f.boss?5:0)-e.c*.1; if(!best||s>best.s) best={s,x:e.x,y:e.y,target:f}; }
    if(best) return {path:pathTo(R,best.x,best.y),x:best.x,y:best.y,target:best.target,heal:true};
    return stay;
  }
  let best=null;
  for(const e of R.ends) for(const f of foes){
    if(!canHit(u,dist(e,f))) continue;
    const fc=forecast(B,u,f,e.x,e.y), n=fc.A.x2?2:1, p=fc.A.hit/100;
    let s=Math.min(f.hp,fc.A.dmg*n)*p;
    if(fc.A.dmg*n>=f.hp) s+=25*p;
    if(f.charId==='wren') s+=3;
    if(!fc.D) s+=2;
    else s-=Math.min(u.hp,fc.D.dmg*(fc.D.x2?2:1))*fc.D.hit/100*.5;
    s+=terr(tAt(B,e.x,e.y)).avo*.05-e.c*.01;
    if(!best||s>best.s) best={s,x:e.x,y:e.y,target:f};
  }
  if(best){ if(u.ai==='guard') u.ai=null; return {path:pathTo(R,best.x,best.y),x:best.x,y:best.y,target:best.target}; }
  if(u.ai==='guard'||u.ai==='hold') return stay;
  // brigands would rather burn a village than walk
  if(u.cls==='brigand'){
    const vs=R.ends.filter(e=>tAt(B,e.x,e.y)==='v'); if(vs.length){ const v=vs.sort((a,b)=>a.c-b.c)[0]; return {path:pathTo(R,v.x,v.y),x:v.x,y:v.y,target:null,raze:true}; }
  }
  const aims=u.cls==='brigand'?foes.concat(B.map.flatMap((row,y)=>row.map((c,x)=>c==='v'?{x,y}:null)).filter(Boolean)):foes;
  const F=field(B,u,aims); let go=null;
  for(const e of R.ends){ const d=F.has(key(e.x,e.y))?F.get(key(e.x,e.y)):999; const s=d*10-terr(tAt(B,e.x,e.y)).avo*.05+e.c*.01;
    if(!go||s<go.s) go={s,x:e.x,y:e.y}; }
  return go?{path:pathTo(R,go.x,go.y),x:go.x,y:go.y,target:null}:stay;
}

if(typeof module!=='undefined') module.exports={clamp,makeUnit,STATS,STAT_NAME,CAP,KINDS,WEAPONS,CLASSES,CHARS,TERRAIN,newRecord,statsAt,levelUp,terr,moveCost,makeBattle,foeUnit,inb,tAt,unitAt,alive,key,dist,wOf,reach,pathTo,canHit,tri,isEff,strike,forecast,resolve,healAmt,TONIC,expFor,HEAL_EXP,outcome,dueReinf,terrainHeal,threat,plan};
