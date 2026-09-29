/* Ink Battles: the map, taps, and the turn-by-turn battle. */
"use strict";
const $=id=>document.getElementById(id);
const cv=$('c'), ctx=cv.getContext('2d');
let DPR=1, VW=0, VH=0, BOX={x:0,y:0,c:40};
let B=null, CH=null;
const UI={mode:'off',sel:null,R:null,from:null,target:null,kind:null,danger:null,dangerAll:false,info:null,targets:[],opts:null,hitCells:null};
const FX={texts:[],parts:[],shots:[],shake:0,flash:0};
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait=ms=>new Promise(r=>setTimeout(r,reduce?ms*.4:ms));
const ease={out:k=>1-Math.pow(1-k,3),back:k=>{const c=1.7;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2);}};
function tween(d,f,e){ d=reduce?d*.4:d; return new Promise(res=>{ const t0=performance.now(); const step=now=>{ const k=Math.min(1,(now-t0)/d); f(e?e(k):k); if(k<1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); }); }
const buzz=ms=>{ try{ navigator.vibrate&&navigator.vibrate(ms); }catch(e){} };
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function resize(){
  DPR=Math.min(2,window.devicePixelRatio||1); VW=innerWidth; VH=innerHeight;
  cv.width=Math.round(VW*DPR); cv.height=Math.round(VH*DPR);
}
let SAFEB=null;
function dockBase(){
  if(SAFEB===null){ const p=document.createElement('div'); p.style.cssText='position:fixed;visibility:hidden;padding-bottom:env(safe-area-inset-bottom,0px)'; document.body.appendChild(p); SAFEB=parseFloat(getComputedStyle(p).paddingBottom)||0; p.remove(); }
  return (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dockH'))||170)+SAFEB;
}
// the camera: when the whole map would be too small to play, it scrolls up and down instead
const CAM={v:0,t:0,max:0,on:false,ah:0,top:0,bot:0,drag:false};
function layout(){
  if(!B) return;
  let top=$('top').hidden?0:$('top').getBoundingClientRect().bottom;
  if(!$('tip').hidden) top=Math.max(top,$('tip').getBoundingClientRect().bottom+4);
  const dockOn=!$('dock').hidden, base=dockOn?dockBase():0;
  const ah=VH-top-base-14;
  // fit the whole map when the squares stay big enough to tap; otherwise fill the width and scroll
  const fit=Math.floor(Math.min(VW/B.w,ah/B.h)), wide=Math.floor(Math.min(VW/B.w,64));
  const scroll=fit<44&&wide>fit, c=Math.max(24,scroll?wide:fit);
  const full=c*B.w>=VW-12;
  CAM.on=scroll; CAM.ah=ah; CAM.top=top; CAM.bot=VH-base; CAM.max=scroll?c*B.h-ah:0;
  CAM.t=clamp(CAM.t,0,CAM.max); CAM.v=clamp(CAM.v,0,CAM.max);
  if(!CAM.drag){ CAM.v+=(CAM.t-CAM.v)*.16; if(Math.abs(CAM.t-CAM.v)<.5) CAM.v=CAM.t; }
  const y=scroll?Math.round(top+10-CAM.v):full?Math.round(top+10):Math.round(top+10+(ah-c*B.h)/2);
  if(dockOn){ const h=full&&!scroll?Math.max(base,VH-(y+c*B.h)-2):base; const d=$('dock'); if(Math.abs((parseFloat(d.style.height)||0)-h)>.5) d.style.height=h+'px'; }
  const want={c,x:Math.round((VW-c*B.w)/2)-(full?0:3),y,full};
  if(!BOX.set){ BOX=Object.assign(want,{set:1}); return; }
  BOX.full=full;
  // glide to the new size so the board never jumps under a finger; scrolling is already smoothed
  ['c','x'].forEach(k=>{ BOX[k]+=(want[k]-BOX[k])*.2; if(Math.abs(want[k]-BOX[k])<.5) BOX[k]=want[k]; });
  if(scroll) BOX.y=want.y; else { BOX.y+=(want.y-BOX.y)*.2; if(Math.abs(want.y-BOX.y)<.5) BOX.y=want.y; }
}
// bring a square into view if it sits near the edge of what's showing
function focus(x,y,always){
  if(!CAM.on) return;
  const c=BOX.c, top=y*c, cur=CAM.t;
  if(!always&&top>=cur+c*.6&&top+c<=cur+CAM.ah-c*.6) return;
  CAM.t=clamp(top+c/2-CAM.ah/2,0,CAM.max);
}
// small ink chevrons that say there is more map above or below
function scrollCues(t){
  if(!CAM.on) return;
  const g=ctx, cx=VW/2, b=Math.sin(t*3)*2;
  const cue=(y,up)=>{ rr(g,cx-22,y-11,44,22,11); g.fillStyle='#fff'; g.fill(); g.lineWidth=2; g.strokeStyle='#000'; g.stroke();
    g.beginPath(); const d=up?-1:1; g.moveTo(cx-7,y-3*d+b*d); g.lineTo(cx,y+4*d+b*d); g.lineTo(cx+7,y-3*d+b*d); g.lineWidth=2.6; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
  if(CAM.v>4) cue(CAM.top+22,true);
  if(CAM.v<CAM.max-4) cue(CAM.bot-22,false);
}
const cellX=x=>BOX.x+(x+.5)*BOX.c, cellY=y=>BOX.y+(y+.5)*BOX.c;

/* ---------- drawing the map ---------- */
let SEEDS=null;
function seedBoard(){
  let s=(CH.id.charCodeAt(1)||7)*9301; const r=()=>{ s=(s*16807+11)%2147483647; return s/2147483647; };
  SEEDS=[]; for(let y=0;y<B.h;y++){ SEEDS.push([]); for(let x=0;x<B.w;x++) SEEDS[y].push({a:r(),b:r(),c:r(),d:r()}); }
}
function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function tuft(g,x,y,s){ g.beginPath(); g.moveTo(x-s,y-s*1.1); g.lineTo(x-s*.3,y); g.moveTo(x,y-s*1.5); g.lineTo(x,y); g.moveTo(x+s,y-s*1.1); g.lineTo(x+s*.3,y); g.stroke(); }
function tree(g,x,y,r,c){
  g.lineWidth=Math.max(1.6,c*.045); g.beginPath(); g.moveTo(x,y+r*.4); g.lineTo(x,y+r*1.25); g.stroke();
  g.beginPath(); for(let i=0;i<7;i++){ const a=i/7*TAU-Math.PI/2, rr2=r*(i%2?.84:1); const px=x+Math.cos(a)*rr2, py=y+Math.sin(a)*rr2*.92; i?g.lineTo(px,py):g.moveTo(px,py); } g.closePath();
  g.fillStyle='#fff'; g.fill(); g.save(); g.clip(); g.globalAlpha=.8; g.fillStyle=patIn(g,'hatch',DPR*.4); g.fillRect(x+r*.1,y-r,r*1.2,r*2.2); g.restore(); g.lineJoin='round'; g.stroke();
}
function drawTile(g,ch,X,Y,c,S,t,x,y){
  g.strokeStyle='#000'; g.fillStyle='#000'; g.lineWidth=Math.max(1.2,c*.03); g.lineCap='round'; g.lineJoin='round';
  const wet=(xx,yy)=>xx<0||yy<0||xx>=B.w||yy>=B.h||B.map[yy][xx]==='~'||B.map[yy][xx]==='b';
  if(ch==='.'){ if(S.a<.5){ g.globalAlpha=.4; tuft(g,X+c*(.2+S.b*.6),Y+c*(.3+S.c*.5),c*.06); g.globalAlpha=1; } }
  else if(ch==='f'){ tree(g,X+c*(.34+S.b*.08),Y+c*.34,c*.2,c); tree(g,X+c*(.66-S.c*.06),Y+c*.56,c*.17,c); }
  else if(ch==='m'){
    g.beginPath(); g.moveTo(X+c*.06,Y+c*.84); g.quadraticCurveTo(X+c*.22,Y+c*.14,X+c*(.46+S.b*.08),Y+c*.16); g.quadraticCurveTo(X+c*.78,Y+c*.2,X+c*.94,Y+c*.84); g.closePath();
    g.fillStyle='#fff'; g.fill(); g.save(); g.clip(); g.fillStyle=patIn(g,'hatch',DPR*.4); g.fillRect(X+c*.52,Y,c*.5,c); g.restore(); g.lineWidth=Math.max(1.8,c*.05); g.stroke();
    g.lineWidth=Math.max(1,c*.03); g.beginPath(); g.moveTo(X+c*.4,Y+c*.3); g.lineTo(X+c*.34,Y+c*.46); g.stroke(); }
  else if(ch==='~'||ch==='b'){
    for(let k=0;k<3;k++){ const yy=Y+c*(.22+k*.3), ph=t*1.4+x*.9+k*1.7; g.globalAlpha=.5; g.beginPath();
      for(let i=0;i<=8;i++){ const xx=X+c*(.12+i*.095); const w=Math.sin(ph+i*.9)*c*.035; i?g.lineTo(xx,yy+w):g.moveTo(xx,yy+w); } g.stroke(); }
    g.globalAlpha=1; g.lineWidth=Math.max(2,c*.05); g.beginPath();
    if(!wet(x,y-1)){ g.moveTo(X,Y); g.lineTo(X+c,Y); } if(!wet(x,y+1)){ g.moveTo(X,Y+c); g.lineTo(X+c,Y+c); }
    if(!wet(x-1,y)){ g.moveTo(X,Y); g.lineTo(X,Y+c); } if(!wet(x+1,y)){ g.moveTo(X+c,Y); g.lineTo(X+c,Y+c); } g.stroke();
    if(ch==='b'){ g.beginPath(); g.rect(X+c*.14,Y,c*.72,c); g.fillStyle='#fff'; g.fill(); g.lineWidth=Math.max(1.2,c*.03);
      for(let i=1;i<5;i++){ g.moveTo(X+c*.14,Y+c*i/5); g.lineTo(X+c*.86,Y+c*i/5); } g.stroke();
      g.lineWidth=Math.max(2,c*.055); g.beginPath(); g.moveTo(X+c*.14,Y); g.lineTo(X+c*.14,Y+c); g.moveTo(X+c*.86,Y); g.lineTo(X+c*.86,Y+c); g.stroke(); } }
  else if(ch==='#'){
    const cx=X+c/2, cy=Y+c*.56, r=c*.36; g.beginPath();
    for(let i=0;i<7;i++){ const a=i/7*TAU-.4, rr2=r*(.82+((i*37+S.a*10)%1)*.28); const px=cx+Math.cos(a)*rr2*1.08, py=cy+Math.sin(a)*rr2*.9; i?g.lineTo(px,py):g.moveTo(px,py); }
    g.closePath(); g.fillStyle='#fff'; g.fill(); g.save(); g.clip(); g.fillStyle=patIn(g,'hatch',DPR*.4); g.fillRect(cx+r*.05,cy-r,r*1.3,r*2.2); g.restore();
    g.lineWidth=Math.max(2,c*.055); g.stroke(); }
  else if(ch==='W'){
    g.fillStyle='#000'; g.fillRect(X,Y,c+.5,c+.5); g.strokeStyle='#fff'; g.lineWidth=Math.max(1,c*.025); g.globalAlpha=.75; g.beginPath();
    for(let i=1;i<4;i++){ g.moveTo(X,Y+c*i/4); g.lineTo(X+c,Y+c*i/4); }
    for(let i=0;i<4;i++){ const off=i%2?.25:.75; g.moveTo(X+c*off,Y+c*i/4); g.lineTo(X+c*off,Y+c*(i+1)/4); } g.stroke(); g.globalAlpha=1; g.strokeStyle='#000'; }
  else if(ch==='F'){
    const x0=X+c*.2, w=c*.6, top=Y+c*.3, bot=Y+c*.86;
    g.beginPath(); g.moveTo(x0,bot); g.lineTo(x0,top); for(let i=0;i<3;i++){ g.lineTo(x0+w*(i*2+.0)/5,top); g.lineTo(x0+w*(i*2+.0)/5,top-c*.08); g.lineTo(x0+w*(i*2+1)/5,top-c*.08); g.lineTo(x0+w*(i*2+1)/5,top); } g.lineTo(x0+w,top); g.lineTo(x0+w,bot); g.closePath();
    g.fillStyle='#fff'; g.fill(); g.lineWidth=Math.max(1.8,c*.05); g.stroke();
    g.beginPath(); g.moveTo(X+c*.42,bot); g.lineTo(X+c*.42,Y+c*.62); g.arc(X+c*.5,Y+c*.62,c*.08,Math.PI,0); g.lineTo(X+c*.58,bot); g.closePath(); g.fillStyle='#000'; g.fill();
    const f=Math.sin(t*4+x)*c*.03; g.lineWidth=Math.max(1.3,c*.035); g.beginPath(); g.moveTo(X+c*.5,top-c*.08); g.lineTo(X+c*.5,Y+c*.04); g.stroke();
    g.beginPath(); g.moveTo(X+c*.5,Y+c*.04); g.quadraticCurveTo(X+c*.62,Y+c*.02+f,X+c*.74,Y+c*.08+f); g.lineTo(X+c*.5,Y+c*.16); g.closePath(); g.fillStyle='#000'; g.fill(); }
  else if(ch==='T'){
    g.beginPath(); rr(g,X+c*.26,Y+c*.1,c*.48,c*.56,c*.12); g.fillStyle='#fff'; g.fill(); g.save(); g.clip(); g.fillStyle=patIn(g,'hatch',DPR*.4); g.fillRect(X,Y,c,c); g.restore(); g.lineWidth=Math.max(1.8,c*.05); g.stroke();
    g.beginPath(); g.rect(X+c*.2,Y+c*.56,c*.6,c*.14); g.fillStyle='#fff'; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(X+c*.26,Y+c*.7); g.lineTo(X+c*.26,Y+c*.88); g.moveTo(X+c*.74,Y+c*.7); g.lineTo(X+c*.74,Y+c*.88); g.stroke();
    g.beginPath(); g.moveTo(X+c*.38,Y+c*.14); g.lineTo(X+c*.42,Y+c*.02); g.lineTo(X+c*.5,Y+c*.1); g.lineTo(X+c*.58,Y+c*.02); g.lineTo(X+c*.62,Y+c*.14); g.closePath(); g.fillStyle='#000'; g.fill(); }
  else if(ch==='G'){
    g.beginPath(); g.moveTo(X+c*.1,Y+c*.94); g.lineTo(X+c*.1,Y+c*.4); g.arc(X+c*.5,Y+c*.4,c*.4,Math.PI,0); g.lineTo(X+c*.9,Y+c*.94); g.closePath(); g.fillStyle='#fff'; g.fill(); g.lineWidth=Math.max(2,c*.055); g.stroke();
    g.save(); g.clip(); g.lineWidth=Math.max(1.4,c*.04); g.beginPath(); for(let i=1;i<5;i++){ g.moveTo(X+c*(.1+i*.16),Y); g.lineTo(X+c*(.1+i*.16),Y+c); } for(let i=1;i<4;i++){ g.moveTo(X,Y+c*(.3+i*.16)); g.lineTo(X+c,Y+c*(.3+i*.16)); } g.stroke(); g.restore(); }
  else if(ch==='v'||ch==='V'||ch==='x'){
    const bx=X+c*.22, bw=c*.56, by=Y+c*.46, bh=c*.4;
    if(ch==='x'){ g.globalAlpha=.8; g.beginPath(); g.moveTo(bx,by+bh); g.lineTo(bx,by+c*.06); g.lineTo(bx+bw*.3,by+c*.14); g.lineTo(bx+bw*.46,by); g.lineTo(bx+bw*.7,by+c*.16); g.lineTo(bx+bw,by+c*.1); g.lineTo(bx+bw,by+bh); g.closePath();
      g.fillStyle='#fff'; g.fill(); g.lineWidth=Math.max(1.6,c*.045); g.stroke(); g.globalAlpha=1;
      for(let i=0;i<3;i++){ const k=((t*.5+i/3+S.a)%1); g.globalAlpha=.4*(1-k); g.beginPath(); g.arc(X+c*(.5+Math.sin(k*5+i)*.08),Y+c*(.4-k*.36),c*(.05+k*.07),0,TAU); g.fillStyle='#000'; g.fill(); }
      g.globalAlpha=1; return; }
    g.beginPath(); g.rect(bx,by,bw,bh); g.fillStyle='#fff'; g.fill(); g.lineWidth=Math.max(1.6,c*.045); g.stroke();
    g.beginPath(); g.moveTo(bx-c*.08,by); g.lineTo(X+c*.5,Y+c*.12); g.lineTo(bx+bw+c*.08,by); g.closePath(); g.fillStyle='#fff'; g.fill(); g.save(); g.clip(); g.fillStyle=ch==='V'?'#000':patIn(g,'hatch',DPR*.4); g.fillRect(X,Y,c,c); g.restore(); g.stroke();
    g.beginPath(); g.rect(X+c*.44,by+bh*.4,c*.12,bh*.6); g.fillStyle=ch==='V'?'#000':'#fff'; g.fill(); g.stroke(); }
  else if(ch==='c'){
    g.beginPath(); g.ellipse(X+c*.5,Y+c*.84,c*.26,c*.08,0,0,TAU); g.fillStyle='#000'; g.fill();
    g.beginPath(); g.rect(X+c*.34,Y+c*.2,c*.32,c*.62); g.fillStyle='#fff'; g.fill(); g.lineWidth=Math.max(1.6,c*.045); g.stroke();
    g.lineWidth=Math.max(1,c*.025); g.beginPath(); g.moveTo(X+c*.45,Y+c*.24); g.lineTo(X+c*.45,Y+c*.8); g.moveTo(X+c*.55,Y+c*.24); g.lineTo(X+c*.55,Y+c*.8); g.stroke();
    g.beginPath(); g.rect(X+c*.26,Y+c*.12,c*.48,c*.1); g.fillStyle='#fff'; g.fill(); g.lineWidth=Math.max(1.6,c*.045); g.stroke(); }
}
function drawTerrain(t){
  const g=ctx, c=BOX.c, R=BOX.full?0:18;
  // paper board with the same hard shadow as the panels
  if(!BOX.full){ rr(g,BOX.x+6,BOX.y+7,c*B.w,c*B.h,R); g.fillStyle='#000'; g.fill(); }
  rr(g,BOX.x,BOX.y,c*B.w,c*B.h,R); g.fillStyle='#fff'; g.fill();
  g.save(); rr(g,BOX.x,BOX.y,c*B.w,c*B.h,R); g.clip();
  g.strokeStyle='#000'; g.globalAlpha=.13; g.lineWidth=1; g.setLineDash([2,4]);
  g.beginPath(); for(let x=1;x<B.w;x++){ g.moveTo(BOX.x+x*c,BOX.y); g.lineTo(BOX.x+x*c,BOX.y+B.h*c); } for(let y=1;y<B.h;y++){ g.moveTo(BOX.x,BOX.y+y*c); g.lineTo(BOX.x+B.w*c,BOX.y+y*c); } g.stroke();
  g.setLineDash([]); g.globalAlpha=1;
  for(let y=0;y<B.h;y++) for(let x=0;x<B.w;x++) drawTile(g,B.map[y][x],BOX.x+x*c,BOX.y+y*c,c,SEEDS[y][x],t,x,y);
  g.restore();
  if(BOX.full){ g.beginPath(); g.moveTo(0,BOX.y); g.lineTo(VW,BOX.y); g.moveTo(0,BOX.y+c*B.h); g.lineTo(VW,BOX.y+c*B.h); g.lineWidth=2.5; g.strokeStyle='#000'; g.stroke(); }
  else { rr(g,BOX.x,BOX.y,c*B.w,c*B.h,R); g.lineWidth=2.5; g.strokeStyle='#000'; g.stroke(); }
}
function cellFill(x,y,kind,t){
  const g=ctx, c=BOX.c, X=BOX.x+x*c, Y=BOX.y+y*c, p=3;
  rr(g,X+p,Y+p,c-p*2,c-p*2,c*.16);
  if(kind==='move'){ g.globalAlpha=.42; g.fillStyle=patIn(g,'hatch',DPR*.45); g.fill(); g.globalAlpha=.9; g.lineWidth=1.8; g.strokeStyle='#000'; g.stroke(); }
  else if(kind==='hit'){ g.globalAlpha=.55; g.fillStyle=patIn(g,'dots',DPR*.45); g.fill(); g.globalAlpha=1; g.setLineDash([4,3]); g.lineWidth=1.8; g.strokeStyle='#000'; g.stroke(); g.setLineDash([]); }
  else if(kind==='danger'){ g.globalAlpha=.3; g.fillStyle=patIn(g,'cross',DPR*.5); g.fill(); g.globalAlpha=.75; g.setLineDash([2,4]); g.lineWidth=1.5; g.strokeStyle='#000'; g.stroke(); g.setLineDash([]); }
  else if(kind==='target'){ const pulse=1+Math.sin(t*6)*.04; g.save(); g.translate(X+c/2,Y+c/2); g.scale(pulse,pulse); g.translate(-X-c/2,-Y-c/2); rr(g,X+2,Y+2,c-4,c-4,c*.2); g.lineWidth=3; g.strokeStyle='#000'; g.setLineDash([6,4]); g.lineDashOffset=-t*20; g.stroke(); g.setLineDash([]); g.restore(); }
  g.globalAlpha=1;
}
function brackets(x,y,t){
  const g=ctx, c=BOX.c, cx=BOX.x+(x+.5)*c, cy=BOX.y+(y+.5)*c, s=c*.5+Math.sin(t*5)*c*.03, l=c*.2;
  g.lineWidth=3.2; g.strokeStyle='#000'; g.lineCap='round';
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,b])=>{ g.beginPath(); g.moveTo(cx+a*s,cy+b*s-b*l); g.lineTo(cx+a*s,cy+b*s); g.lineTo(cx+a*s-a*l,cy+b*s); g.stroke(); });
}
function drawOne(u,t){
  const g=ctx, c=BOX.c; if(u.hp<=0&&!u.dying) return;
  if(u.vx===undefined){ u.vx=u.x; u.vy=u.y; u.seed=Math.random()*10; }
  const fly=CLASSES[u.cls].move==='fly', shake=(u.shake||0)*Math.sin(t*70)*c*.06;
  const bx=BOX.x+(u.vx+.5)*c+(u.ox||0)*c, feet=BOX.y+(u.vy+.5)*c+c*.24+(u.oy||0)*c;
  const lift=fly?c*(.1+Math.sin(t*2.6+u.seed)*.03):0, hop=(u.hop||0)*c, fade=u.dying?Math.max(0,1-u.dying):1;
  g.save(); g.globalAlpha=(u.acted&&u.team==='ally'&&B.phase==='player'?.45:1)*fade*(u.appear===undefined?1:u.appear);
  // the base: solid ink for your side, a dashed ring for the enemy
  const bw=c*.3*(fly?.75:1), bh=c*.07;
  g.beginPath(); g.ellipse(bx,feet+c*.01,bw,bh,0,0,TAU);
  if(u.team==='ally'){ g.fillStyle='#000'; g.fill(); }
  else { g.fillStyle='#fff'; g.fill(); g.setLineDash([3,3]); g.lineWidth=2; g.strokeStyle='#000'; g.stroke(); g.setLineDash([]); }
  const S=c*.9*(u.boss?1.06:1)*(u.dying?1-u.dying*.5:1);
  drawUnit(g,u,bx+shake,feet-lift-hop,S,{t,seed:u.seed,foe:u.team==='enemy'&&!u.boss,boss:!!u.boss,sq:u.sq||0,dpr:DPR,flip:u.flip,moving:!!u.moving});
  // a speech mark over someone Wren can talk to
  if(u.talk&&u.team==='enemy'&&!u.dying){ const x0=bx+c*.28, y0=feet-c*1.02+Math.sin(t*3)*c*.03; rr(g,x0,y0,c*.3,c*.22,c*.08); g.fillStyle='#fff'; g.fill(); g.lineWidth=2; g.strokeStyle='#000'; g.stroke();
    g.beginPath(); g.moveTo(x0+c*.06,y0+c*.22); g.lineTo(x0+c*.02,y0+c*.3); g.lineTo(x0+c*.13,y0+c*.22); g.fill(); g.stroke(); [0,1,2].forEach(i=>{ g.beginPath(); g.arc(x0+c*(.08+i*.07),y0+c*.11,c*.022,0,TAU); g.fillStyle='#000'; g.fill(); }); }
  // hp bar
  if(!u.dying){ const w=c*.56, h=Math.max(5,c*.08), x0=bx-w/2, y0=feet+c*.08; const shp=u.shp===undefined?u.hp:u.shp, k=clamp(shp/u.maxhp,0,1);
    rr(g,x0,y0,w,h,h/2); g.fillStyle='#fff'; g.fill();
    g.save(); rr(g,x0,y0,w,h,h/2); g.clip();
    if(u.team==='ally'){ g.fillStyle='#000'; g.fillRect(x0,y0,w*k,h); }
    else { g.fillStyle=patIn(g,'hatch',DPR*.3); g.fillRect(x0,y0,w*k,h); g.fillStyle='#000'; g.globalAlpha*=.3; g.fillRect(x0,y0,w*k,h); }
    g.restore(); rr(g,x0,y0,w,h,h/2); g.lineWidth=1.6; g.strokeStyle='#000'; g.stroke(); }
  g.restore();
}
function drawFX(t,dt){
  const g=ctx, c=BOX.c;
  FX.shots=FX.shots.filter(s=>{ s.k+=dt/s.d; if(s.k>=1) return false; const k=s.k, x=s.x0+(s.x1-s.x0)*k, arc=s.kind==='bow'?.35:s.kind==='tome'?.1:.6, y=s.y0+(s.y1-s.y0)*k-Math.sin(k*Math.PI)*c*arc;
    g.save(); g.translate(x,y);
    if(s.kind==='bow'){ const vy=(s.y1-s.y0)-Math.cos(k*Math.PI)*Math.PI*c*arc; g.rotate(Math.atan2(vy,s.x1-s.x0)); g.lineWidth=2.6; g.strokeStyle='#000'; g.beginPath(); g.moveTo(-c*.3,0); g.lineTo(c*.14,0); g.stroke(); g.beginPath(); g.moveTo(c*.2,0); g.lineTo(c*.08,-c*.06); g.lineTo(c*.08,c*.06); g.closePath(); g.fillStyle='#000'; g.fill(); g.beginPath(); g.moveTo(-c*.3,0); g.lineTo(-c*.38,-c*.06); g.moveTo(-c*.3,0); g.lineTo(-c*.38,c*.06); g.stroke(); }
    else if(s.kind==='tome'){ const r=c*(.12+Math.sin(t*30)*.02); g.beginPath(); g.arc(0,0,r,0,TAU); g.fillStyle=s.dark?'#000':'#fff'; g.fill(); g.lineWidth=2.4; g.strokeStyle='#000'; g.stroke(); g.beginPath(); g.arc(0,0,r*.4,0,TAU); g.fillStyle=s.dark?'#fff':'#000'; g.fill();
      if(Math.random()<.6) FX.parts.push({kind:'ink',x,y,vx:(Math.random()-.5)*c,vy:(Math.random()-.5)*c,g:0,s:c*.04,life:.3,max:.3}); }
    else { g.rotate(k*14); g.lineWidth=2.4; g.strokeStyle='#000'; g.beginPath(); g.moveTo(-c*.2,0); g.lineTo(c*.2,0); g.stroke(); g.beginPath(); g.moveTo(c*.2,0); g.lineTo(c*.1,-c*.06); g.lineTo(c*.1,c*.06); g.closePath(); g.fillStyle='#000'; g.fill(); }
    g.restore(); return true; });
  FX.parts=FX.parts.filter(p=>{ p.life-=dt; if(p.life<=0) return false; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=p.g*dt; const k=p.life/p.max;
    g.save(); g.globalAlpha=Math.min(1,k*1.6);
    if(p.kind==='star'){ g.translate(p.x,p.y); g.rotate(p.r+t*3); const s=p.s*k; g.beginPath(); for(let i=0;i<8;i++){ const a=i/8*TAU, rr2=i%2?s*.4:s; g.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2); } g.closePath(); g.fillStyle='#fff'; g.fill(); g.lineWidth=2; g.strokeStyle='#000'; g.stroke(); }
    else if(p.kind==='drop'){ g.beginPath(); g.arc(p.x,p.y,p.s*(.5+k*.5),0,TAU); g.fillStyle='#fff'; g.fill(); g.lineWidth=1.8; g.strokeStyle='#000'; g.stroke(); }
    else { g.beginPath(); g.arc(p.x,p.y,p.s*(.4+k*.6),0,TAU); g.fillStyle='#000'; g.fill(); }
    g.restore(); return true; });
  FX.texts=FX.texts.filter(f=>{ f.age+=dt; if(f.age>f.dur) return false; const k=f.age/f.dur;
    const pop=k<.18?ease.back(k/.18):1, rise=k*c*.55, a=k>.7?1-(k-.7)/.3:1;
    g.save(); g.globalAlpha=a; g.translate(f.x,f.y-rise); g.scale(pop*(k<.1?1.3-k*3:1),pop);
    g.font=`italic 900 ${Math.round(f.size||c*.5)}px Fraunces, Georgia, serif`; g.textAlign='center'; g.textBaseline='middle';
    g.lineJoin='round'; g.lineWidth=Math.max(5,c*.12); g.strokeStyle='#fff'; g.strokeText(f.s,0,0); g.fillStyle='#000'; g.fillText(f.s,0,0); g.restore(); return true; });
}
function floatText(u,s,size){ FX.texts.push({x:cellX(u.vx),y:cellY(u.vy)-BOX.c*.6,s,size,age:0,dur:1.05}); }
function splat(u,n,kind){ const x=cellX(u.vx), y=cellY(u.vy)-BOX.c*.1;
  for(let i=0;i<n;i++){ const a=Math.random()*TAU, v=BOX.c*(1.4+Math.random()*2.6); FX.parts.push({kind:kind||'ink',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-BOX.c*1.5,g:BOX.c*7,s:BOX.c*(.05+Math.random()*.06),life:.5+Math.random()*.35,max:.85,r:Math.random()*3}); } }

let last=performance.now(); const T0=performance.now(); const LIVE=[];
function frame(now){
  const dt=Math.min(.05,(now-last)/1000); last=now; const t=(now-T0)/1000;
  ctx.setTransform(DPR,0,0,DPR,0,0); ctx.clearRect(0,0,VW,VH);
  if(B&&!B.hidden){
    layout();
    if(FX.shake>0){ FX.shake=Math.max(0,FX.shake-dt*2.5); ctx.translate(Math.sin(t*90)*FX.shake*8,Math.cos(t*77)*FX.shake*6); }
    drawTerrain(t);
    if(UI.dangerAll&&UI.mode!=='enemy'&&UI.mode!=='busy') allDanger().forEach(k=>{ const [x,y]=k.split(',').map(Number); cellFill(x,y,'danger',t); });
    else if(UI.danger) UI.danger.forEach(k=>{ const [x,y]=k.split(',').map(Number); cellFill(x,y,'danger',t); });
    if(UI.mode==='select'&&UI.R){ UI.hitCells.forEach(k=>{ const [x,y]=k.split(',').map(Number); cellFill(x,y,'hit',t); }); UI.R.ends.forEach(e=>cellFill(e.x,e.y,'move',t)); }
    if(UI.mode==='act'||UI.mode==='confirm') UI.targets.forEach(o=>cellFill(o.x,o.y,UI.mode==='confirm'&&o===UI.target?'target':'hit',t));
    if(CH.goal.kind==='seize'&&UI.mode==='idle') for(let y=0;y<B.h;y++) for(let x=0;x<B.w;x++) if(/[TG]/.test(B.map[y][x])&&!unitAt(B,x,y)) cellFill(x,y,'target',t);
    if(UI.sel&&UI.mode!=='busy'&&UI.mode!=='enemy') brackets(UI.sel.x,UI.sel.y,t);
    else if(UI.info&&UI.mode==='idle') brackets(UI.info.x,UI.info.y,t);
    B.units.slice().sort((a,b)=>(a.vy===undefined?a.y:a.vy)-(b.vy===undefined?b.y:b.vy)).forEach(u=>drawOne(u,t));
    drawFX(t,dt);
    scrollCues(t);
    if(FX.flash>0){ FX.flash=Math.max(0,FX.flash-dt*4); ctx.setTransform(DPR,0,0,DPR,0,0); ctx.globalAlpha=FX.flash*.8; ctx.fillStyle='#fff'; ctx.fillRect(0,0,VW,VH); ctx.globalAlpha=1; }
  }
  LIVE.forEach(f=>f(t,dt));
  requestAnimationFrame(frame);
}
let DANGER_CACHE=null;
function allDanger(){ if(DANGER_CACHE) return DANGER_CACHE; const s=new Set(); alive(B,'enemy').forEach(e=>threat(B,e).forEach(k=>s.add(k))); DANGER_CACHE=s; return s; }
const dirty=()=>{ DANGER_CACHE=null; };

/* ---------- cards, tips and callouts ---------- */
function card(html,opt){
  opt=opt||{}; LIVE.length=0;
  const el=$('card'); el.className=opt.home?'home':''; el.hidden=false;
  el.innerHTML=`<div class="panel${opt.still?' still':''}">${html}</div>`; el.scrollTop=0;
  el.querySelectorAll('canvas[data-who]').forEach(c=>portrait(c,whoOf(c.dataset.who),{foe:!!c.dataset.foe}));
  return el.querySelector('.panel');
}
function closeCard(){ $('card').hidden=true; $('card').innerHTML=''; LIVE.length=0; }
function liveArt(canvas,draw){
  const d=Math.min(2,window.devicePixelRatio||1); const fit=()=>{ const w=canvas.clientWidth, h=canvas.clientHeight; canvas.width=Math.round(w*d); canvas.height=Math.round(h*d); return {w,h}; };
  let sz=fit(); const g=canvas.getContext('2d');
  LIVE.push((t,dt)=>{ if(!canvas.isConnected) return; if(canvas.clientWidth!==sz.w) sz=fit(); g.setTransform(d,0,0,d,0,0); g.clearRect(0,0,sz.w,sz.h); draw(g,sz.w,sz.h,t,dt,d); });
}
// a character id, a class name, or a battle unit, turned into something drawUnit understands
function whoOf(w){
  if(typeof w==='object') return w;
  if(CHARS[w]) return {cls:CHARS[w].cls,charId:w,name:CHARS[w].name,wpn:CLASSES[CHARS[w].cls].wpn};
  if(CLASSES[w]) return {cls:w,wpn:CLASSES[w].wpn};
  return {cls:'soldier',wpn:'lance'};
}
const who=(id,foe)=>`<canvas data-who="${id}"${foe?' data-foe="1"':''}></canvas>`;
function callout(big,small){ const el=$('callout'); el.querySelector('b').textContent=big; el.querySelector('span').textContent=small||''; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); }
let tipTimer=null;
function tip(id,text){
  if(G.tips[id]) return; G.tips[id]=1; save();
  const el=$('tip'), x=$('tipx'); $('tipt').textContent=text; el.hidden=false; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  x.classList.remove('done','run'); void x.offsetWidth; x.classList.add('run'); clearTimeout(tipTimer); tipTimer=setTimeout(()=>x.classList.add('done'),reduce?200:2600);
}
function tipAway(){ if($('tipx').classList.contains('done')) $('tip').hidden=true; }
$('tipx').addEventListener('click',()=>{ if($('tipx').classList.contains('done')) $('tip').hidden=true; });

// one line at a time, with the speaker's face; resolves when the scene ends
function scene(lines,opt){
  opt=opt||{};
  return new Promise(res=>{
    let i=0;
    const show=()=>{
      const [sp,text]=lines[i], u=whoOf(sp), foe=typeof sp==='object'&&sp.team==='enemy';
      const nm=u.name||(u.boss&&u.boss.name)||CLASSES[u.cls].name;
      const p=card(`${opt.title&&i===0?`<p class="kicker">${esc(opt.title)}</p>`:''}<div class="talk${foe?' them':''}"><canvas id="face"></canvas><div><b>${esc(nm)}</b><q>${esc(text)}</q></div></div>
        ${lines.length>1?`<div class="dots">${lines.map((_,k)=>`<i class="${k<=i?'on':''}"></i>`).join('')}</div>`:'<div style="height:14px"></div>'}
        ${i<lines.length-1?`<div class="two"><button class="btn ghost" id="skip">Skip</button><button class="btn" id="next">Next</button></div>`:`<button class="btn" id="next">${esc(opt.done||'Continue')}</button>`}`,{home:opt.home,still:i>0});
      liveArt($('face'),(g,w,h,t,dt,d)=>drawBust(g,u,w,h,{t,seed:1,dpr:d,foe:foe&&!u.boss,boss:!!u.boss,sq:Math.max(0,Math.sin(t*9))*.05}));
      sfx('talk');
      $('next').onclick=()=>{ i++; if(i<lines.length) show(); else { closeCard(); res(); } };
      if($('skip')) $('skip').onclick=()=>{ sfx('tap'); closeCard(); res(); };
    };
    show();
  });
}

/* ---------- the dock ---------- */
function tagOf(u){ const w=wOf(u); return CLASSES[u.cls].name+' · '+w.name; }
function unitCard(u){
  const shp=u.shp===undefined?u.hp:u.shp, t=terr(tAt(B,u.x,u.y)), w=wOf(u), mg=w.magic||w.kind==='staff';
  const r=w.rng[0]===w.rng[1]?w.rng[0]:w.rng[0]+'–'+w.rng[1];
  return `<div class="uc ${u.team}"><canvas id="ucp"></canvas>
    <div class="un"><b>${esc(u.name)}${u.boss?' ★':''}</b><small>Lv ${u.lv} ${tagOf(u)}</small><div class="bar"><i style="transform:scaleX(${clamp(shp/u.maxhp,0,1)})"></i></div></div>
    <div class="uhp"><b>${shp}</b><small>/${u.maxhp}</small></div></div>
    <div class="ust">${mg?`<span>Mag ${u.mag}</span>`:`<span>Str ${u.str}</span>`}<span>Skl ${u.skl}</span><span>Spd ${u.spd}</span><span>Def ${u.def}${t.def?'+'+t.def:''}</span><span>Res ${u.res}</span><span>Move ${CLASSES[u.cls].mov}</span><span>Range ${r}</span>${t.avo||t.def?`<span class="on">${t.name} +${t.avo} avoid</span>`:''}</div>`;
}
function paintDock(html,acts){
  $('dockin').innerHTML=html+(acts?`<div class="acts">${acts}</div>`:'');
  const c=$('ucp'); if(c){ const u=UI.cardUnit; if(u) portrait(c,u,{foe:u.team==='enemy'&&!u.boss,boss:!!u.boss}); }
}
function showUnit(u,acts){ UI.cardUnit=u; paintDock(unitCard(u),acts); }
function dockIdle(){
  const left=alive(B,'ally').filter(u=>!u.acted).length, dz=`<button class="btn${UI.dangerAll?'':' ghost'}" data-a="danger" aria-pressed="${UI.dangerAll}">Danger</button>`;
  if(UI.info){ showUnit(UI.info,`<button class="btn ghost" data-a="stats">Stats</button>${dz}<button class="btn ghost" data-a="end">End turn</button>`); }
  else paintDock(`<p class="hintline" style="margin:auto 0">${left?'Tap one of your units to move it. Tap an enemy to see its reach.':'Everyone has moved.'}${left?`<br>${left} still ready · ${B.tonics} tonic${B.tonics===1?'':'s'}`:''}</p>`,`${dz}<button class="btn${left?' ghost':''}" data-a="end">End turn</button>`);
}
function options(u){
  const foes=alive(B,'enemy'), friends=alive(B,'ally').filter(a=>a!==u), here=tAt(B,u.x,u.y);
  return {
    atk:foes.filter(e=>canHit(u,dist(u,e))),
    heal:wOf(u).kind==='staff'?friends.filter(a=>dist(u,a)===1&&a.hp<a.maxhp):[],
    talk:u.charId==='wren'?foes.filter(e=>e.talk&&dist(u,e)===1):[],
    visit:here==='v'&&B.villages[key(u.x,u.y)]?[u]:[],
    seize:CH.goal.kind==='seize'&&u.charId==='wren'&&/[TG]/.test(here)?[u]:[],
    tonic:B.tonics>0&&u.hp<u.maxhp?[u]:[]
  };
}
function dockAct(){
  const u=UI.sel, o=options(u); UI.opts=o;
  let a='';
  if(o.seize.length) a+=`<button class="btn" data-a="seize">Seize</button>`;
  if(o.atk.length) a+=`<button class="btn" data-a="atk">Attack</button>`;
  if(o.heal.length) a+=`<button class="btn" data-a="heal">Heal</button>`;
  if(o.talk.length) a+=`<button class="btn" data-a="talk">Talk</button>`;
  if(o.visit.length) a+=`<button class="btn" data-a="visit">Visit</button>`;
  if(o.tonic.length) a+=`<button class="btn ghost" data-a="tonic">Tonic</button>`;
  const any=o.atk.length||o.heal.length||o.talk.length||o.visit.length||o.seize.length;
  a+=`<button class="btn${any?' ghost':''}" data-a="wait">Wait</button><button class="btn ghost" data-a="undo">Back</button>`;
  showUnit(u,a);
  if(CH.id==='c1'&&o.atk.length) tip('act','Attack an enemy in reach, or Wait to hold your ground.');
  if(o.heal.length) tip('heal','Maud can heal a hurt friend standing next to her.');
  if(o.visit.length) tip('visit','Visit villages before brigands burn them. The villagers give gifts.');
}
function dockForecast(){
  const a=UI.sel, d=UI.target;
  if(UI.kind==='heal'){ UI.cardUnit=d; paintDock(unitCard(d),`<button class="btn" data-a="go">Heal ${Math.min(healAmt(a),d.maxhp-d.hp)}</button><button class="btn ghost" data-a="back">Back</button>`); return; }
  if(UI.kind==='talk'){ UI.cardUnit=d; paintDock(unitCard(d),`<button class="btn" data-a="go">Talk to ${esc(d.name)}</button><button class="btn ghost" data-a="back">Back</button>`); return; }
  const f=forecast(B,a,d,a.x,a.y);
  const after=(hp,s)=>s?Math.max(0,hp-s.dmg*(s.x2?2:1)):hp;
  const dHp=after(d.hp,f.A), aHp=f.D?after(a.hp,f.D):a.hp;
  const tg=s=>s&&s.eff?'<span class="adv up">Effective</span>':s&&s.tri>0?'<span class="adv up">▲</span>':s&&s.tri<0?'<span class="adv down">▼</span>':'';
  const v=(s,k)=>s?`${s[k]}${k==='hit'||k==='crt'?'<small>%</small>':''}${k==='dmg'&&s.x2?'<span class="x2">×2</span>':''}`:'<small>–</small>';
  paintDock(`<div class="fc">
    <div class="nm">${esc(a.name)}${tg(f.A)}</div><div class="lab">vs</div><div class="nm">${esc(d.name)}${tg(f.D)}</div>
    <div class="v">${a.hp}<small> → </small>${aHp}</div><div class="lab">HP</div><div class="v">${d.hp}<small> → </small>${dHp}</div>
    <div class="v">${v(f.A,'dmg')}</div><div class="lab">Dmg</div><div class="v">${f.D?v(f.D,'dmg'):'<small>Can’t reach</small>'}</div>
    <div class="v">${v(f.A,'hit')}</div><div class="lab">Hit</div><div class="v">${v(f.D,'hit')}</div>
    <div class="v">${v(f.A,'crt')}</div><div class="lab">Crit</div><div class="v">${v(f.D,'crt')}</div></div>`,
    `<button class="btn" data-a="go">Attack</button><button class="btn ghost" data-a="back">Back</button>`);
  if(CH.id==='c1') tip('tri','Swords beat axes, axes beat lances, lances beat swords. The winning side hits harder and more often.');
}
$('dock').addEventListener('click',e=>{
  const b=e.target.closest('[data-a]'); if(!b||UI.mode==='busy'||UI.mode==='enemy'||UI.mode==='off') return; sfx('tap'); const a=b.dataset.a;
  if(a==='end') return endTurn();
  if(a==='danger'){ UI.dangerAll=!UI.dangerAll; dirty(); return dockIdle(); }
  if(a==='stats') return statCard(UI.info);
  if(a==='cancel'){ UI.mode='idle'; UI.sel=null; return dockIdle(); }
  if(a==='wait') return finishUnit(UI.sel);
  if(a==='undo'){ const u=UI.sel; u.x=UI.from.x; u.y=UI.from.y; u.vx=u.x; u.vy=u.y; return select(u); }
  if(a==='back'){ UI.mode='act'; UI.target=null; UI.targets=[]; return dockAct(); }
  if(a==='seize') return doSeize(UI.sel);
  if(a==='visit') return doVisit(UI.sel);
  if(a==='tonic') return doTonic(UI.sel);
  if(a==='atk'||a==='heal'||a==='talk'){
    UI.kind=a; const list=UI.opts[a]; UI.targets=list;
    if(list.length===1){ UI.target=list[0]; UI.mode='confirm'; dockForecast(); }
    else { UI.mode='act'; paintDock(`<p class="hintline" style="margin:auto 0">Tap ${a==='heal'?'a friend to heal':a==='talk'?'who to talk to':'an enemy to attack'}.</p>`,`<button class="btn ghost" data-a="back">Back</button>`); }
    return;
  }
  if(a==='go'){ const u=UI.sel, d=UI.target; if(UI.kind==='atk') doAttack(u,d); else if(UI.kind==='heal') doHeal(u,d); else if(UI.kind==='talk') doTalk(u,d); }
});

/* ---------- taps on the map ---------- */
let down=null;
cv.addEventListener('pointerdown',e=>{ down={x:e.clientX,y:e.clientY,cam:CAM.v}; CAM.drag=false; try{ cv.setPointerCapture(e.pointerId); }catch(err){} audioInit(); });
cv.addEventListener('pointermove',e=>{
  if(!down||!CAM.on) return;
  const dy=e.clientY-down.y;
  if(!CAM.drag&&Math.abs(dy)>10) CAM.drag=true;
  if(CAM.drag){ CAM.v=clamp(down.cam-dy,0,CAM.max); CAM.t=CAM.v; }
});
const endDrag=()=>{ CAM.drag=false; down=null; };
cv.addEventListener('pointercancel',endDrag);
cv.addEventListener('wheel',e=>{ if(!B||!CAM.on) return; e.preventDefault(); CAM.t=clamp(CAM.t+e.deltaY,0,CAM.max); },{passive:false});
cv.addEventListener('pointerup',e=>{
  if(CAM.drag){ endDrag(); return; }
  if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>14) return; down=null;
  if(!B||!$('card').hidden||UI.mode==='off'||UI.mode==='busy'||UI.mode==='enemy') return;
  if(CAM.on&&(e.clientY<CAM.top||e.clientY>CAM.bot)) return;
  const x=Math.floor((e.clientX-BOX.x)/BOX.c), y=Math.floor((e.clientY-BOX.y)/BOX.c);
  if(!inb(B,x,y)) return; tapCell(x,y);
});
function select(u){
  tipAway();
  focus(u.x,u.y);
  UI.mode='select'; UI.sel=u; UI.info=null; UI.danger=null; UI.R=reach(B,u); UI.from={x:u.x,y:u.y};
  const hits=new Set(), rg=wOf(u).rng, ends=new Set(UI.R.ends.map(e=>key(e.x,e.y)));
  UI.R.ends.forEach(e=>{ for(let dy=-rg[1];dy<=rg[1];dy++) for(let dx=-rg[1];dx<=rg[1];dx++){ const d=Math.abs(dx)+Math.abs(dy), X=e.x+dx, Y=e.y+dy; if(d<rg[0]||d>rg[1]||!inb(B,X,Y)) continue; if(!ends.has(key(X,Y))) hits.add(key(X,Y)); } });
  UI.hitCells=hits; sfx('pick'); u.sq=.5; tween(260,k=>u.sq=.5*(1-k)*Math.cos(k*9));
  showUnit(u,`<button class="btn ghost" data-a="cancel">Cancel</button>`);
}
function tapCell(x,y){
  const u=unitAt(B,x,y);
  if(UI.mode==='idle'){
    if(u&&u.team==='ally'&&!u.acted) return select(u);
    if(u){ UI.info=u; UI.danger=u.team==='enemy'?threat(B,u):null; sfx('tap'); return dockIdle(); }
    UI.info=null; UI.danger=null; return dockIdle();
  }
  if(UI.mode==='select'){
    if(u&&u.team==='ally'&&u!==UI.sel&&!u.acted) return select(u);
    const end=UI.R.ends.find(e=>e.x===x&&e.y===y);
    if(end) return moveTo(UI.sel,end);
    // tap an enemy in reach: step to the best square to hit it from and show the forecast
    if(u&&u.team==='enemy'){ const opts=UI.R.ends.filter(e=>canHit(UI.sel,dist(e,u)));
      if(opts.length){ const cur=opts.find(e=>e.x===UI.sel.x&&e.y===UI.sel.y); const best=cur||opts.sort((a,b)=>(terr(tAt(B,b.x,b.y)).avo-terr(tAt(B,a.x,a.y)).avo)||a.c-b.c)[0];
        return moveTo(UI.sel,best,u); }
      UI.info=u; UI.danger=threat(B,u); UI.mode='idle'; UI.sel=null; return dockIdle(); }
    UI.mode='idle'; UI.sel=null; return dockIdle();
  }
  if(UI.mode==='act'||UI.mode==='confirm'){
    const t=UI.targets.find(o=>o.x===x&&o.y===y);
    if(t){ if(!UI.kind) UI.kind='atk'; UI.target=t; UI.mode='confirm'; sfx('tap'); return dockForecast(); }
  }
}
async function moveTo(u,end,then){
  UI.mode='busy'; const path=pathTo(UI.R,end.x,end.y);
  await walk(u,path); u.x=end.x; u.y=end.y;
  UI.mode='act'; UI.kind=null; UI.targets=[]; dockAct();
  if(then&&UI.opts.atk.includes(then)){ UI.kind='atk'; UI.target=then; UI.targets=UI.opts.atk; UI.mode='confirm'; dockForecast(); }
}
async function walk(u,path){
  const hooves=CLASSES[u.cls].move==='horse'||CLASSES[u.cls].move==='fly'; u.moving=true;
  for(let i=1;i<path.length;i++){ const a=path[i-1], b=path[i]; u.flip=b.x<a.x?true:b.x>a.x?false:u.flip; sfx(hooves?'hoof':'step');
    await tween(hooves?95:120,k=>{ u.vx=a.x+(b.x-a.x)*k; u.vy=a.y+(b.y-a.y)*k; u.hop=Math.sin(k*Math.PI)*.12; u.sq=-Math.sin(k*Math.PI)*.3; }); }
  u.hop=0; u.moving=false; if(path.length>1) await tween(150,k=>u.sq=.45*(1-k)*Math.cos(k*8));
  u.sq=0;
}

/* ---------- actions ---------- */
async function animStrike(a,t,ev){
  const dx=t.x-a.x, dy=t.y-a.y, L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L, d=dist(a,t), w=wOf(a);
  if(dx) a.flip=dx<0;
  sfx('wind'); await tween(150,k=>{ a.ox=-ux*.13*k; a.oy=-uy*.13*k; a.sq=.55*k; },ease.out);
  if(ev.crit){ FX.flash=1; await wait(120); }
  if(d<=1&&w.kind!=='tome'){ await tween(85,k=>{ a.ox=-ux*.13+ux*.55*k; a.oy=-uy*.13+uy*.55*k; a.sq=.55-1.2*k; }); }
  else { FX.shots.push({x0:cellX(a.vx),y0:cellY(a.vy)-BOX.c*.25,x1:cellX(t.vx),y1:cellY(t.vy)-BOX.c*.25,k:0,d:w.kind==='bow'?.22:.3,kind:w.kind==='bow'?'bow':w.kind==='tome'?'tome':'throw',dark:a.wpn==='blot'});
    sfx(w.kind==='tome'?'spell':'shot'); await tween(90,k=>{ a.ox=-ux*.13*(1-k); a.oy=-uy*.13*(1-k); a.sq=.55-1.1*k; }); await wait(w.kind==='bow'?150:220); }
  if(ev.hit){ t.shp=Math.max(0,(t.shp===undefined?t.hp+ev.dmg:t.shp)-ev.dmg);
    if(ev.crit){ floatText(t,'Critical!',BOX.c*.42); FX.shake=1; splat(t,20); sfx('crit'); buzz([30,30,60]); await wait(80); }
    floatText(t,ev.dmg?String(ev.dmg):'No damage',ev.dmg?BOX.c*.55:BOX.c*.34); splat(t,6+Math.min(ev.dmg,14)); if(!ev.crit) sfx(ev.dmg?'hit':'clink'); buzz(ev.kill?35:18);
    t.shake=1; t.sq=-.5; tween(260,k=>{ t.shake=1-k; t.sq=-.5*(1-k); }); }
  else { floatText(t,'Miss',BOX.c*.4); sfx('miss'); tween(300,k=>{ t.ox=Math.sin(k*Math.PI)*.25*(dy?1:0); t.oy=Math.sin(k*Math.PI)*.2*(dx?-1:0); }); }
  await tween(200,k=>{ const f=1-k, m=d<=1&&w.kind!=='tome'; a.ox=(m?ux*.42:0)*f; a.oy=(m?uy*.42:0)*f; a.sq=(m?-.65:-.55)*f; },ease.out);
  a.ox=a.oy=0; a.sq=0; t.ox=t.oy=0;
}
async function knockOut(u){
  splat(u,18); sfx(u.team==='ally'?'lost':'ko'); buzz(40);
  u.dying=0.001; await tween(460,k=>{ u.dying=k; u.hop=Math.sin(k*Math.PI)*.3; }); u.dying=0; u.hop=0; dirty();
  if(u.team==='ally'){
    if(u.charId!=='wren'){ B.fallen.push(u.charId); await quoteCard(u,CHARS[u.charId].death,G.mode==='casual'?`${u.name} is too hurt to fight on, and will rejoin after this chapter.`:`${u.name} has fallen and will not return.`); }
  } else if(u.boss){ callout(u.boss.name,'defeated'); await wait(700); }
}
function quoteCard(u,text,note){
  return new Promise(res=>{
    card(`<div class="talk${u.team==='enemy'?' them':''}"><canvas id="face"></canvas><div><b>${esc(u.name)}</b><q>${esc(text)}</q></div></div>${note?`<p style="margin:14px 0 12px">${esc(note)}</p>`:'<div style="height:14px"></div>'}<button class="btn" id="ok">Continue</button>`);
    liveArt($('face'),(g,w,h,t,dt,d)=>drawBust(g,u,w,h,{t,seed:1,dpr:d,foe:u.team==='enemy'&&!u.boss,boss:!!u.boss}));
    $('ok').onclick=()=>{ sfx('tap'); closeCard(); res(); };
  });
}
async function fight(a,d){
  // bosses have a word first
  const boss=[a,d].find(u=>u.boss&&u.team==='enemy'&&!u.spoke);
  if(boss&&boss.boss.line){ boss.spoke=true; await quoteCard(boss,boss.boss.line); }
  const a0=a.hp, d0=d.hp;
  const seq=resolve(B,a,d);
  // resolve() already changed hp; replay the fight from the starting numbers
  a.shp=a0; d.shp=d0;
  for(const ev of seq){ const s=ev.who==='a'?a:d, t=ev.who==='a'?d:a; await animStrike(s,t,ev); await wait(90); if(ev.kill){ t.shp=undefined; await knockOut(t); } }
  a.shp=undefined; d.shp=undefined;
  const dealtBy=w=>seq.filter(e=>e.who===w).reduce((s,e)=>s+e.dmg,0);
  for(const [u,foe,dealt] of [[a,d,dealtBy('a')],[d,a,dealtBy('d')]]){ if(u.hp<=0) continue; const g=expFor(u,foe,dealt,foe.hp<=0); if(g>0) await giveXp(u,g); }
}
async function giveXp(u,g){
  const m=u.ref; if(!m) return;
  m.xp=(m.xp||0)+g; u.xp=m.xp;
  FX.texts.push({x:cellX(u.vx),y:cellY(u.vy)+BOX.c*.05,s:'+'+g+' exp',size:BOX.c*.26,age:0,dur:.9});
  while(m.xp>=100&&m.lv<20){ m.xp-=100; const gains=levelUp(m);
    STATS.forEach(k=>{ if(k!=='hp') u[k]=m[k]; }); u.lv=m.lv; u.maxhp=m.hp; u.hp+=gains.hp;
    B.levels.push(u.name); sfx('level'); await levelCard(u,gains); }
  if(m.lv>=20) m.xp=0;
}
function levelCard(u,gains){
  return new Promise(res=>{
    const cur=k=>k==='hp'?u.maxhp:u[k];
    card(`<canvas id="lvart" style="width:100%;height:120px"></canvas><h2>Level ${u.lv}!</h2><p>${esc(u.name)} grew stronger.</p>
      <div class="lvl">${STATS.map((k,i)=>`<div><span>${STAT_NAME[k]}</span><span class="n">${cur(k)}${gains[k]?`<span class="stats"><span class="up" style="animation-delay:${.2+i*.1}s">+1</span></span>`:''}</span></div>`).join('')}</div>
      <button class="btn" id="ok">Continue</button>`);
    liveArt($('lvart'),(g,w,h,t,dt,d)=>{ const j=Math.abs(Math.sin(t*4))*h*.1; g.beginPath(); g.ellipse(w/2,h*.92,h*.22*(1-j/h),h*.04,0,0,TAU); g.fillStyle='#000'; g.fill(); drawUnit(g,u,w/2,h*.92-j,h*.62,{t,seed:3,dpr:d,sq:j<2?.3:-.12}); });
    $('ok').onclick=()=>{ sfx('tap'); closeCard(); res(); };
  });
}
function statCard(u){
  const w=wOf(u), prev=UI.mode; UI.mode='off';
  const bar=k=>`<div>${STAT_NAME[k]}</div><div class="sb"><i style="width:${Math.round(Math.min(1,(k==='hp'?u.maxhp:u[k])/(k==='hp'?60:30))*100)}%"></i></div><div class="n">${k==='hp'?u.hp+'/'+u.maxhp:u[k]}</div>`;
  const bio=u.charId&&u.team==='ally'?CHARS[u.charId].bio:u.boss?'An enemy commander. Defeat or outlast them.':'One of the Smudge King’s soldiers.';
  card(`<div class="stage"><canvas id="stat"></canvas></div><h2>${esc(u.name)}</h2><p style="margin-bottom:10px">Level ${u.lv} ${CLASSES[u.cls].name}${u.ref?` · ${u.ref.xp} exp`:''}</p>
    <div class="stats">${STATS.map(bar).join('')}</div>
    <div class="how"><p><b>${w.name}</b> · ${KINDS[w.kind].name}${w.kind==='staff'?`, heals ${healAmt(u)}`:`, might ${w.mt}, hit ${w.hit}${w.crt?', crit '+w.crt:''}, range ${w.rng[0]===w.rng[1]?w.rng[0]:w.rng.join('–')}`}${w.note?'. '+w.note:''}.</p><p>${esc(bio)}</p></div>
    <button class="btn" id="ok">Close</button>`);
  liveArt($('stat'),(g,wd,h,t,dt,d)=>{ g.beginPath(); g.ellipse(wd/2,h*.88,h*.22,h*.05,0,0,TAU); if(u.team==='ally'){ g.fillStyle='#000'; g.fill(); } else { g.setLineDash([4,4]); g.lineWidth=2; g.stroke(); g.setLineDash([]); }
    drawUnit(g,u,wd/2,h*.88,h*.66,{t,seed:2,dpr:d,foe:u.team==='enemy'&&!u.boss,boss:!!u.boss}); });
  $('ok').onclick=()=>{ sfx('tap'); closeCard(); UI.mode=prev==='off'?'idle':prev; };
}
async function doAttack(a,d){ UI.mode='busy'; UI.targets=[]; showUnit(a,''); await fight(a,d); await afterAction(a); }
async function doHeal(a,t){
  UI.mode='busy'; UI.targets=[]; const h=Math.min(healAmt(a),t.maxhp-t.hp);
  if(t.x!==a.x) a.flip=t.x<a.x; a.sq=.4; tween(300,k=>a.sq=.4*(1-k));
  sfx('heal'); for(let i=0;i<12;i++) FX.parts.push({kind:'drop',x:cellX(t.vx)+(Math.random()-.5)*BOX.c*.6,y:cellY(t.vy)-BOX.c*.9,vx:0,vy:BOX.c*(1+Math.random()),g:BOX.c*2,s:BOX.c*.06,life:.6,max:.6});
  t.shp=t.hp; await tween(500,k=>t.shp=Math.round(t.hp+h*k)); t.hp+=h; t.shp=undefined; floatText(t,'+'+h);
  await wait(300); if(a.team==='ally') await giveXp(a,HEAL_EXP); if(a.team==='ally') await afterAction(a);
}
async function doTonic(u){
  UI.mode='busy'; B.tonics--; const h=Math.min(TONIC,u.maxhp-u.hp);
  sfx('heal'); for(let i=0;i<8;i++) FX.parts.push({kind:'drop',x:cellX(u.vx)+(Math.random()-.5)*BOX.c*.5,y:cellY(u.vy)-BOX.c*.8,vx:0,vy:BOX.c*(1+Math.random()),g:BOX.c*2,s:BOX.c*.05,life:.5,max:.5});
  u.shp=u.hp; await tween(400,k=>u.shp=Math.round(u.hp+h*k)); u.hp+=h; u.shp=undefined; floatText(u,'+'+h);
  await wait(250); await afterAction(u);
}
async function doTalk(w,t){
  UI.mode='busy'; UI.targets=[];
  await scene(CH.talks[t.talk]);
  t.team='ally'; t.ai=null; t.acted=true; t.talk=null; t.ref=newRecord(t.charId); t.ref.hp=t.maxhp; t.xp=0;
  B.recruits.push(t.charId); dirty();
  splat(t,14,'star'); sfx('join'); floatText(t,'Joined!',BOX.c*.46);
  await tween(360,k=>{ t.hop=Math.sin(k*Math.PI)*.35; t.sq=-Math.sin(k*Math.PI)*.4; }); t.hop=0;
  await afterAction(w);
}
async function doVisit(u){
  UI.mode='busy'; const k=key(u.x,u.y), v=B.villages[k], b=BOOSTS[v.give];
  delete B.villages[k]; B.map[u.y][u.x]='V'; sfx('visit');
  let got;
  if(v.give==='tonic'){ B.tonics+=2; got='Two tonics'; }
  else { const s=b.stat; if(s==='hp'){ u.maxhp+=b.n; u.hp+=b.n; u.ref.hp+=b.n; } else { u[s]+=b.n; u.ref[s]+=b.n; } got=`${b.name}: ${STAT_NAME[s]} +${b.n}`; }
  B.gifts.push(got);
  await new Promise(res=>{ card(`<p class="kicker">Village</p><div class="quote">${esc(v.line)}<small>A villager</small></div><div class="won"><b>${esc(u.name)} received</b><span>${esc(got)}</span></div><button class="btn" id="ok">Continue</button>`);
    $('ok').onclick=()=>{ sfx('tap'); closeCard(); res(); }; });
  splat(u,10,'star'); await afterAction(u);
}
async function doSeize(u){
  UI.mode='busy'; sfx('seize'); B.seized=true;
  for(let i=0;i<3;i++){ splat(u,12,'star'); await tween(260,k=>{ u.hop=Math.sin(k*Math.PI)*.3; }); }
  u.hop=0; callout('Seized!'); await wait(900); await afterAction(u);
}
async function afterAction(u){
  UI.targets=[]; UI.target=null; dirty();
  if(await checkEnd()) return;
  finishUnit(u);
}
function finishUnit(u){
  if(u) u.acted=true; UI.sel=null; UI.mode='idle'; UI.info=null; UI.danger=null; dirty();
  if(B.phase!=='player') return;
  if(!alive(B,'ally').some(x=>!x.acted)) setTimeout(()=>{ if(B&&B.phase==='player'&&UI.mode==='idle') endTurn(); },380); else dockIdle();
}
async function checkEnd(){
  const o=outcome(B); if(!o) return false;
  UI.mode='off'; await wait(500); endBattle(o); return true;
}
async function mend(team){
  const list=terrainHeal(B,team);
  if(!list.length) return;
  sfx('heal'); list.forEach(({u,h})=>{ floatText(u,'+'+h,BOX.c*.4); for(let i=0;i<5;i++) FX.parts.push({kind:'drop',x:cellX(u.vx)+(Math.random()-.5)*BOX.c*.5,y:cellY(u.vy)-BOX.c*.8,vx:0,vy:BOX.c,g:BOX.c*2,s:BOX.c*.05,life:.5,max:.5}); });
  await wait(500);
}
async function endTurn(){
  tipAway();
  if(B.phase!=='player') return;
  B.phase='enemy'; UI.mode='enemy'; UI.sel=null; UI.info=null; UI.danger=null; UI.targets=[];
  paintDock(`<p class="hintline" style="margin:auto 0">The enemy is moving…</p>`,'');
  callout('Enemy phase'); sfx('foeturn'); await wait(1000);
  const fresh=dueReinf(B);
  if(fresh.length){ focus(fresh[0].x,fresh[0].y,true); fresh.forEach(u=>{ u.vx=u.x; u.vy=u.y; u.seed=Math.random()*10; u.appear=0; tween(500,k=>u.appear=k).then(()=>u.appear=undefined); splat(u,8); }); callout('Reinforcements'); sfx('foeturn'); dirty(); await wait(1100); }
  await mend('enemy');
  const order=alive(B,'enemy').filter(u=>!u.fresh).sort((a,b)=>(wOf(a).kind==='staff')-(wOf(b).kind==='staff')||b.y-a.y);
  for(const r of order){
    if(r.hp<=0||r.team!=='enemy') continue;
    const p=plan(B,r);
    if(p.path.length>1||p.target){ const was=CAM.t; focus(r.x,r.y); if(CAM.on&&Math.abs(CAM.t-was)>4) await wait(320); }
    if(p.path.length>1){ await walk(r,p.path); r.x=p.x; r.y=p.y; }
    if(p.target){ const was=CAM.t; focus(p.target.x,p.target.y); if(CAM.on&&Math.abs(CAM.t-was)>4) await wait(260); }
    if(p.heal&&p.target.hp>0){ await wait(100); await doHeal(r,p.target); }
    else if(p.raze&&tAt(B,r.x,r.y)==='v'){ B.map[r.y][r.x]='x'; delete B.villages[key(r.x,r.y)]; B.razed++; splat(r,16); sfx('raze'); floatText(r,'Burned',BOX.c*.42); await wait(700); }
    else if(p.target&&p.target.hp>0){ await wait(120); await fight(r,p.target); if(await checkEnd()) return; }
    else if(p.path.length>1) await wait(60);
  }
  B.units.forEach(u=>u.fresh=false);
  if(CH.goal.kind==='survive'&&B.turn>=CH.goal.turns){ UI.mode='off'; await wait(300); return endBattle('win'); }
  B.turn++; B.phase='player'; alive(B,'ally').forEach(u=>u.acted=false); dirty(); hud();
  { const w=alive(B,'ally').find(u=>u.charId==='wren'); if(w) focus(w.x,w.y,true); }
  UI.mode='busy'; await mend('ally');
  UI.mode='idle';
  callout('Player phase',CH.goal.kind==='survive'?`${CH.goal.turns-B.turn+1} turn${CH.goal.turns-B.turn+1===1?'':'s'} to hold`:''); sfx('turn'); dockIdle();
  if(CH.id==='c1'&&B.turn===2) setTimeout(()=>tip('danger','Tap Danger to see every square the enemy can hit next turn.'),1200);
}
function goalText(){ const g=CH.goal; return g.kind==='survive'?`Survive ${g.turns} turns`:g.kind==='seize'?'Seize the '+(CH.map.join('').includes('G')?'gate':'throne')+' with Wren':g.kind==='boss'?'Defeat '+CH.foes.find(f=>f.boss).boss.name:'Defeat every enemy'; }
function hud(){ $('hn').textContent=CH.name; $('hsub').textContent=goalText(); $('turn').textContent=B.turn; $('tsub').textContent=CH.goal.kind==='survive'?'of '+CH.goal.turns:'Turn'; }
