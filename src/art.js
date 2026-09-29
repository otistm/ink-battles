/* Ink Battles: every soldier, horse and pattern, drawn in code. */
"use strict";
const TAU=Math.PI*2;
const PATS={};
function makePats(){
  const tile=(w,h,f)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); g.strokeStyle='#000'; g.fillStyle='#000'; f(g); return c; };
  PATS.hatchT=tile(12,12,g=>{ g.lineWidth=2; g.beginPath(); g.moveTo(-3,15); g.lineTo(15,-3); g.moveTo(-3,3); g.lineTo(3,-3); g.moveTo(9,15); g.lineTo(15,9); g.stroke(); });
  PATS.dotsT=tile(12,12,g=>{ g.beginPath(); g.arc(3,3,1.9,0,TAU); g.arc(9,9,1.9,0,TAU); g.fill(); });
  PATS.crossT=tile(12,12,g=>{ g.lineWidth=1.4; g.beginPath(); g.moveTo(-3,15); g.lineTo(15,-3); g.moveTo(-3,-3); g.lineTo(15,15); g.stroke(); });
  PATS.brickT=tile(16,12,g=>{ g.lineWidth=1.3; g.beginPath(); g.moveTo(0,.5); g.lineTo(16,.5); g.moveTo(0,6.5); g.lineTo(16,6.5); g.moveTo(4,0); g.lineTo(4,6); g.moveTo(12,6); g.lineTo(12,12); g.stroke(); });
}
// patterns are tiled in screen pixels no matter how the drawing is scaled
function patIn(g,name,scale){ const p=g.createPattern(PATS[name+'T']||PATS.hatchT,'repeat'); const m=g.getTransform(); const s=scale||1;
  if(p.setTransform) p.setTransform(new DOMMatrix([s/Math.hypot(m.a,m.b),0,0,s/Math.hypot(m.c,m.d),0,0])); return p; }
const E_=(g,x,y,rx,ry,r)=>{ g.beginPath(); g.ellipse(x,y,rx,ry,r||0,0,TAU); };
// a soft closed shape: the points act as control handles, so corners come out rounded
function blob(g,p){ const n=p.length, m=i=>[(p[i][0]+p[(i+1)%n][0])/2,(p[i][1]+p[(i+1)%n][1])/2]; const s0=m(n-1); g.beginPath(); g.moveTo(s0[0],s0[1]);
  for(let i=0;i<n;i++){ const e=m(i); g.quadraticCurveTo(p[i][0],p[i][1],e[0],e[1]); } g.closePath(); }
// right half from top to bottom, mirrored into a full outline
const sym=h=>h.concat(h.slice().reverse().filter(q=>q[0]!==0).map(([x,y])=>[-x,y]));
function line(g,o,pts,w,col){ g.beginPath(); pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.lineWidth=o.lw*(w||1); g.strokeStyle=col||'#000'; g.stroke(); }
function W(g,o,k){ g.fillStyle='#fff'; g.fill(); g.lineWidth=o.lw*(k||1); g.strokeStyle='#000'; g.stroke(); }
function K(g,o,k){ g.fillStyle='#000'; g.fill(); if(o){ g.lineWidth=o.lw*(k||1); g.strokeStyle='#000'; g.stroke(); } }
// the weapon triangle is worn: swords in solid ink, lances hatched, axes dotted, everything else plain paper
const KINDPAT={sword:'solid',lance:'hatch',axe:'dots'};
function fillBy(g,o,pat,k){
  g.fillStyle='#fff'; g.fill();
  if(pat==='solid'){ g.fillStyle='#000'; g.fill(); }
  else if(pat==='hatch'||pat==='dots'){ g.fillStyle=patIn(g,pat,o.dpr*.5); g.fill(); }
  g.lineWidth=o.lw*(k||1); g.strokeStyle='#000'; g.stroke();
}

/* ---------- faces ---------- */
function face(g,o,cx,cy,r){
  const L=o.look||{}, blink=((o.t+o.seed*3.1)%4.3)<.13, er=r*.2;
  [-1,1].forEach(s=>{ const x=cx+s*r*.38, y=cy+r*.06;
    if(blink){ line(g,o,[[x-er,y],[x+er,y]],1.2); }
    else { E_(g,x,y,er,er*1.15); W(g,o,.8); E_(g,x+o.look2*er*.25+s*er*.1,y+er*.12,er*.62,er*.7); g.fillStyle='#000'; g.fill();
      E_(g,x+o.look2*er*.25+s*er*.1-er*.22,y-er*.12,er*.22,er*.22); g.fillStyle='#fff'; g.fill(); }
    if(o.foe) line(g,o,[[x-s*er*1.3,y-er*1.7],[x+s*er*1.1,y-er*1.05]],1.5);
    else if(o.boss) line(g,o,[[x-s*er*1.2,y-er*1.5],[x+s*er,y-er*1.3]],1.5);
  });
  if(L.glasses) [-1,1].forEach(s=>{ E_(g,cx+s*r*.38,cy+r*.06,er*1.55,er*1.55); g.lineWidth=o.lw*.9; g.strokeStyle='#000'; g.stroke(); line(g,o,[[cx-r*.12,cy],[cx+r*.12,cy]],.8); });
  if(L.freckles) [-1,1].forEach(s=>[[.52,.42],[.66,.36],[.6,.5]].forEach(([u,v])=>{ E_(g,cx+s*r*u,cy+r*v,r*.03,r*.03); g.fillStyle='#000'; g.fill(); }));
  if(L.beard){ blob(g,sym([[0,cy+r*.34],[r*.5,cy+r*.3],[r*.62,cy+r*.62],[r*.3,cy+r*1.02],[0,cy+r*1.12]])); K(g,o,.8); }
  // mouth
  const my=cy+r*(L.beard?.5:.5);
  if(L.beard){ g.beginPath(); g.moveTo(cx-r*.14,my); g.quadraticCurveTo(cx,my+r*.1,cx+r*.14,my); g.lineWidth=o.lw*.9; g.strokeStyle='#fff'; g.stroke(); }
  else if(o.foe||o.boss){ line(g,o,[[cx-r*.14,my+r*.06],[cx,my],[cx+r*.14,my+r*.06]],.9); }
  else { g.beginPath(); g.moveTo(cx-r*.14,my); g.quadraticCurveTo(cx,my+r*.14,cx+r*.14,my); g.lineWidth=o.lw*.9; g.strokeStyle='#000'; g.stroke(); }
}

/* ---------- held weapons ---------- */
function weapon(g,o,w,hx,hy){
  const kind=WEAPONS[w].kind, sw=Math.sin(o.t*2.1+o.seed)*.04;
  g.save(); g.translate(hx,hy); g.rotate(sw);
  if(kind==='sword'){ g.rotate(.18);
    blob(g,[[-.055,-.12],[.055,-.12],[.06,-.78],[0,-.92],[-.06,-.78]]); w==='quill'?W(g,o):W(g,o); if(w==='quill'){ line(g,o,[[0,-.2],[0,-.8]],.6); }
    g.beginPath(); g.rect(-.16,-.14,.32,.07); K(g,o,.6); line(g,o,[[0,-.07],[0,.1]],2.2); E_(g,0,.12,.05,.05); K(g); }
  else if(kind==='lance'){
    const top=w==='javelin'?-.9:-1.12; line(g,o,[[0,.36],[0,top+.12]],1.8);
    blob(g,[[0,top-.14],[.08,top+.05],[0,top+.2],[-.08,top+.05]]); W(g,o); if(w!=='javelin') line(g,o,[[-.07,top+.24],[.07,top+.24]],1.4); }
  else if(kind==='axe'){
    const top=w==='handaxe'?-.55:-.72; line(g,o,[[0,.3],[0,top]],1.8);
    g.beginPath(); g.moveTo(0,top+.02); g.quadraticCurveTo(.34,top-.14,.34,top+.14); g.quadraticCurveTo(.34,top+.4,0,top+.26); g.closePath(); fillBy(g,o,w==='steelaxe'?'solid':'white'); }
  else if(kind==='bow'){
    g.beginPath(); g.arc(-.1,-.1,.5,-1.25,1.25); g.lineWidth=o.lw*1.9; g.strokeStyle='#000'; g.stroke();
    line(g,o,[[-.1+Math.cos(-1.25)*.5,-.1+Math.sin(-1.25)*.5],[-.1+Math.cos(1.25)*.5,-.1+Math.sin(1.25)*.5]],.6); }
  else if(kind==='tome'){
    g.rotate(-.12); g.beginPath(); g.rect(-.14,-.2,.3,.36); fillBy(g,o,w==='blot'?'solid':'white'); line(g,o,[[-.08,-.2],[-.08,.16]],.8,w==='blot'?'#fff':'#000');
    const sp=(o.t*1.8+o.seed)%1; E_(g,.06+Math.sin(o.t*3+o.seed)*.06,-.3-sp*.3,.04*(1-sp)+.01,.04*(1-sp)+.01); g.fillStyle='#000'; g.fill(); }
  else if(kind==='staff'){
    line(g,o,[[0,.36],[0,-.86]],1.6); E_(g,0,-.96,.13,.13); W(g,o,1.2); E_(g,0,-.96,.05,.05); K(g); line(g,o,[[-.12,-.72],[.12,-.72]],1.1); }
  g.restore();
}

/* ---------- people ---------- */
const GEAR={lord:'circlet',merc:'band',fighter:'bandana',brigand:'horns',soldier:'kettle',knight:'helm',general:'helm',cav:'plume',archer:'hood',mage:'wizard',cleric:'veil',peg:'wings',sorc:'crown'};
function person(g,o,cls,wpn,seated){
  const kind=WEAPONS[wpn].kind, pat=KINDPAT[kind]||'white', heavy=cls==='knight'||cls==='general', gear=GEAR[cls], L=o.look||{};
  const bw=heavy?.54:.42;
  // cape for lords and the king
  if(cls==='lord'||cls==='sorc'){ const f=Math.sin(o.t*2.6+o.seed)*.05; blob(g,[[-.3,-.12],[.3,-.12],[.5+f,.6],[.56+f,.9],[-.56-f,.9],[-.5-f,.6]]); cls==='sorc'?fillBy(g,o,'solid'):fillBy(g,o,'hatch'); }
  if(L.long&&gear!=='helm'){ blob(g,sym([[0,-.9],[.36,-.8],[.46,-.2],[.4,.24],[0,.2]])); K(g,o); }
  if(L.pony){ const f=Math.sin(o.t*3+o.seed)*.06; blob(g,[[-.2,-.76],[-.5,-.6+f],[-.62,-.1+f],[-.46,-.2],[-.3,-.5]]); K(g,o); }
  if(!seated) [-1,1].forEach(s=>{ E_(g,s*.2,.93,.16,.08); W(g,o); });
  // body
  blob(g,sym([[0,-.14],[bw*.8,-.12],[bw,.3],[bw*1.05,seated?.6:.88],[0,seated?.62:.9]])); fillBy(g,o,heavy?'hatch':pat);
  if(heavy){ blob(g,sym([[0,-.08],[bw*.72,-.06],[bw*.78,.34],[0,.4]])); fillBy(g,o,pat==='hatch'?'white':pat); line(g,o,[[0,-.06],[0,.38]],.7,pat==='solid'?'#fff':'#000');
    [-1,1].forEach(s=>{ E_(g,s*bw*.92,-.06,.2,.13); W(g,o); }); }
  if(!heavy) line(g,o,[[-bw*.95,.46],[bw*.95,.46]],1.1,pat==='solid'?'#fff':'#000');
  if(cls==='cleric'){ line(g,o,[[0,.02],[0,.36]],1.4); line(g,o,[[-.1,.14],[.1,.14]],1.4); }
  // a shield on the off arm for armored folk
  if(heavy){ blob(g,[[-.74,-.02],[-.4,-.04],[-.38,.44],[-.56,.66],[-.76,.44]]); fillBy(g,o,'white',1.1); E_(g,-.57,.24,.07,.07); K(g); }
  else { E_(g,-bw-.04,.4,.09,.09); W(g,o); }
  // head
  const hy=-.46, hr=.36;
  if(gear==='hood'||gear==='veil'){ blob(g,sym([[0,-.9],[.42,-.78],[.48,-.34],[.4,-.02],[0,-.06]])); fillBy(g,o,gear==='veil'?'white':'hatch'); }
  E_(g,0,hy,hr,hr*.98); W(g,o);
  if(gear==='helm'){
    blob(g,sym([[0,-.9],[.4,-.82],[.44,-.3],[.36,-.1],[0,-.1]])); fillBy(g,o,'white',1.1);
    g.beginPath(); g.rect(-.32,-.52,.64,.14); K(g); [-1,1].forEach(s=>{ E_(g,s*.13,-.45,.045,.045); g.fillStyle='#fff'; g.fill(); });
    line(g,o,[[0,-.36],[0,-.14]],.7);
    if(cls==='general'){ const f=Math.sin(o.t*3+o.seed)*.05; blob(g,[[0,-.86],[.1,-1.02],[-.1,-1.2+f],[-.36,-1.14+f],[-.2,-.96]]); K(g,o); }
  } else {
    face(g,o,0,hy,hr);
    // hair or headgear on top
    if(gear==='circlet'){ blob(g,[[-.38,-.4],[-.42,-.74],[-.26,-.9],[-.14,-.98],[0,-.88],[.12,-1],[.26,-.9],[.4,-.74],[.38,-.4],[.2,-.62],[-.2,-.62]]); K(g,o);
      g.beginPath(); g.rect(-.34,-.72,.68,.08); W(g,o,.8); blob(g,[[0,-.84],[.07,-.72],[0,-.64],[-.07,-.72]]); K(g); }
    else if(gear==='crown'){ g.beginPath(); g.moveTo(-.34,-.66); g.lineTo(-.38,-1.02); g.lineTo(-.18,-.84); g.lineTo(0,-1.1); g.lineTo(.18,-.84); g.lineTo(.38,-1.02); g.lineTo(.34,-.66); g.closePath(); K(g,o);
      [-.2,.06,.24].forEach((x,i)=>{ const d=((o.t*.6+i*.37+o.seed)%1); E_(g,x,-.62+d*.3,.035,.05+d*.03); g.fillStyle='#000'; g.globalAlpha=1-d; g.fill(); g.globalAlpha=1; }); }
    else if(gear==='band'||gear==='wings'){
      if(!L.long&&!L.bob){ blob(g,[[-.36,-.44],[-.3,-.78],[0,-.86],[.3,-.78],[.36,-.44],[.1,-.66],[-.1,-.66]]); K(g,o); }
      if(L.long){ blob(g,[[-.38,-.36],[-.34,-.8],[0,-.88],[.34,-.8],[.38,-.36],[.12,-.64],[-.2,-.62]]); K(g,o); }
      if(L.bob){ blob(g,[[-.42,-.2],[-.4,-.76],[0,-.88],[.4,-.76],[.42,-.2],[.3,-.3],[.26,-.6],[-.26,-.6],[-.3,-.3]]); K(g,o); }
      g.beginPath(); g.rect(-.36,-.66,.72,.08); W(g,o,.8);
      if(gear==='wings') [-1,1].forEach(s=>{ blob(g,[[s*.34,-.64],[s*.6,-.9],[s*.62,-.7],[s*.5,-.6]]); W(g,o,.8); });
      else { const f=Math.sin(o.t*3.4+o.seed)*.05; line(g,o,[[.34,-.62],[.56,-.5+f],[.62,-.42+f]],1.2); } }
    else if(gear==='bandana'){ blob(g,sym([[0,-.86],[.34,-.76],[.38,-.56],[0,-.62]])); fillBy(g,o,'dots'); line(g,o,[[.34,-.6],[.54,-.52],[.58,-.4]],1.4); }
    else if(gear==='horns'){ [-1,1].forEach(s=>{ g.beginPath(); g.moveTo(s*.24,-.72); g.quadraticCurveTo(s*.5,-.84,s*.5,-1.06); g.quadraticCurveTo(s*.36,-.88,s*.14,-.8); g.closePath(); W(g,o); });
      blob(g,sym([[0,-.9],[.38,-.76],[.4,-.56],[0,-.62]])); K(g,o); }
    else if(gear==='kettle'){ g.beginPath(); g.ellipse(0,-.64,.5,.1,0,0,TAU); W(g,o); blob(g,sym([[0,-.94],[.3,-.88],[.34,-.66],[0,-.66]])); fillBy(g,o,'hatch'); }
    else if(gear==='plume'){ blob(g,sym([[0,-.92],[.38,-.8],[.4,-.56],[0,-.6]])); fillBy(g,o,'white'); const f=Math.sin(o.t*3+o.seed)*.05;
      blob(g,[[0,-.88],[-.1,-1.08],[-.36,-1.12+f],[-.5,-.96+f],[-.24,-.9]]); K(g,o); if(L.pony){} }
    else if(gear==='hood'){ blob(g,sym([[0,-.9],[.4,-.78],[.4,-.6],[0,-.68]])); fillBy(g,o,'hatch'); line(g,o,[[.22,-.82],[.44,-1.08]],1.3); blob(g,[[.44,-1.08],[.52,-.98],[.36,-.88]]); W(g,o,.7); }
    else if(gear==='veil'){ blob(g,sym([[0,-.9],[.4,-.78],[.4,-.58],[0,-.66]])); W(g,o); line(g,o,[[0,-.84],[0,-.7]],1); line(g,o,[[-.06,-.78],[.06,-.78]],1);
      if(L.bob){} }
    else if(gear==='wizard'){ if(L.bob){ blob(g,[[-.42,-.22],[-.4,-.66],[0,-.74],[.4,-.66],[.42,-.22],[.3,-.3],[.28,-.56],[-.28,-.56],[-.3,-.3]]); K(g,o); }
      g.beginPath(); g.ellipse(0,-.66,.54,.1,0,0,TAU); K(g,o); const f=Math.sin(o.t*2+o.seed)*.06;
      g.beginPath(); g.moveTo(-.3,-.7); g.quadraticCurveTo(-.1,-1.1,.28+f,-1.34); g.quadraticCurveTo(.16,-1.02,.3,-.7); g.closePath(); K(g,o);
      blob(g,[[.02,-.94],[.05,-.88],[.11,-.87],[.06,-.83],[.08,-.77],[.02,-.81],[-.04,-.77],[-.02,-.83],[-.07,-.87],[-.01,-.88]]); g.fillStyle='#fff'; g.fill(); }
  }
  // weapon in the hand
  weapon(g,o,wpn,bw+.06,.38); E_(g,bw+.06,.4,.09,.09); W(g,o);
}
function horse(g,o,wings){
  const t=o.t*(wings?7:4)+o.seed, step=o.moving?Math.sin(t)*.08:0;
  if(wings){ const f=Math.sin(o.t*6+o.seed)*.22;
    g.save(); g.translate(-.1,.12); g.rotate(-.25-f);
    blob(g,[[0,0],[-.3,-.6],[-.7,-.86],[-1.02,-.8],[-.86,-.56],[-.98,-.4],[-.76,-.24],[-.8,-.06],[-.4,.1]]); W(g,o,1.1);
    line(g,o,[[-.3,-.2],[-.78,-.6]],.7); line(g,o,[[-.3,-.06],[-.72,-.3]],.7); g.restore(); }
  // legs
  [[-.42,step],[-.24,-step],[.3,-step],[.46,step]].forEach(([x,d])=>{ line(g,o,[[x,.5],[x+d,.9]],2.6); line(g,o,[[x+d-.05,.94],[x+d+.07,.94]],2.2); });
  // tail
  const tw=Math.sin(o.t*3+o.seed)*.08; blob(g,[[-.62,.26],[-.9,.3+tw],[-.98,.66+tw],[-.8,.56+tw],[-.66,.46]]); K(g,o);
  // body
  E_(g,0,.42,.64,.26); fillBy(g,o,wings?'white':'white',1.1);
  // neck and head
  blob(g,[[.34,.3],[.46,-.16],[.62,-.36],[.9,-.2],[.94,-.04],[.74,.02],[.62,.3]]); W(g,o,1.1);
  blob(g,[[.5,-.34],[.52,-.5],[.62,-.4]]); W(g,o,.8);
  line(g,o,[[.4,-.08],[.5,-.3],[.58,-.4]],2.2);
  E_(g,.7,-.2,.04,.04); K(g); E_(g,.9,-.07,.02,.02); K(g);
}
/* draw a unit standing with its feet at (x,y), about S pixels tall */
function drawUnit(g,u,x,y,S,opt){
  const o=Object.assign({t:0,seed:0,look2:0,foe:false,boss:false,sq:0,flip:false,dpr:1,look:null,moving:false,bust:false},opt||{});
  const cls=u.cls, wpn=u.wpn||CLASSES[cls].wpn, k=S/2, mounted=cls==='cav'||cls==='peg';
  if(!o.look&&u.charId&&CHARS[u.charId]) o.look=CHARS[u.charId].look;
  o.lw=Math.max(1.3,Math.min(3.2,S*.045))/k;
  g.save(); g.translate(x,y);
  const bob=Math.sin(o.t*2.4+o.seed)*.03, sq=o.sq+bob;
  g.scale(1+sq*.22,1-sq*.22); g.translate(0,-k*1.02); g.scale(o.flip?-k:k,k);
  g.lineJoin='round'; g.lineCap='round';
  if(mounted&&!o.bust){
    horse(g,o,cls==='peg');
    g.save(); g.translate(-.04,-.3); g.scale(.72,.72); const o2=Object.assign({},o,{lw:o.lw/.72}); person(g,o2,cls,wpn,true); g.restore();
  } else person(g,o,cls,wpn,false);
  if(o.boss&&!o.bust){ const y0=mounted?-1.34:-1.28; g.beginPath(); for(let i=0;i<10;i++){ const a=i/10*TAU-Math.PI/2, r=i%2?.07:.16; g.lineTo(Math.cos(a)*r+.46,Math.sin(a)*r+y0+.2); } g.closePath(); K(g,o,.8); }
  g.restore();
}
// a still head-and-shoulders portrait for cards and the dock
function portrait(cv,u,opt){
  const d=Math.min(2,window.devicePixelRatio||1), w=cv.clientWidth||cv.width, h=cv.clientHeight||cv.height;
  cv.width=Math.round(w*d); cv.height=Math.round(h*d); const g=cv.getContext('2d'); g.setTransform(d,0,0,d,0,0); g.clearRect(0,0,w,h);
  drawBust(g,u,w,h,Object.assign({dpr:d},opt||{}));
}
function drawBust(g,u,w,h,opt){ const S=h*1.25, k=S/2; drawUnit(g,u,w/2,h*.5+1.48*k-h*.02,S,Object.assign({bust:true},opt||{})); }
