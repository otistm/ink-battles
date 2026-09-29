/* Ink Battles: tiny procedural sounds. */
"use strict";
let AC=null, MUTE=false;
function audioInit(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(AC&&AC.state==='suspended') AC.resume(); }
function tone(f,d,type,v,f2,at){ if(!AC||MUTE) return; const t=AC.currentTime+(at||0),o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'sine'; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(v,t+.008); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t+d+.03); }
function noise(d,v,fc,q,at){ if(!AC||MUTE) return; const t=AC.currentTime+(at||0),n=Math.floor(AC.sampleRate*d),buf=AC.createBuffer(1,n,AC.sampleRate),a=buf.getChannelData(0); for(let i=0;i<n;i++) a[i]=Math.random()*2-1;
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain(); s.buffer=buf; f.type='bandpass'; f.frequency.value=fc; f.Q.value=q||1; g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+d); s.connect(f).connect(g).connect(AC.destination); s.start(t); }
function sfx(k){ audioInit(); if(!AC||MUTE) return;
  const S={
    tap:()=>tone(660,.05,'triangle',.08),
    pick:()=>{ tone(520,.07,'triangle',.1); tone(780,.08,'triangle',.08,null,.05); },
    step:()=>tone(180+Math.random()*40,.05,'triangle',.06,120),
    hoof:()=>{ tone(240+Math.random()*30,.04,'square',.03,140); tone(200,.04,'square',.03,120,.06); },
    wind:()=>noise(.12,.06,900,.8),
    shot:()=>tone(900,.18,'sine',.07,300),
    spell:()=>{ tone(300,.3,'sawtooth',.05,900); noise(.25,.06,1500,3); },
    hit:()=>{ noise(.12,.3,500,.9); tone(140,.14,'triangle',.25,60); },
    crit:()=>{ noise(.2,.4,300,.7); tone(90,.3,'square',.18,40); tone(1200,.12,'triangle',.08,400,.02); },
    clink:()=>tone(1400,.08,'square',.05,900),
    miss:()=>noise(.18,.08,2400,2),
    ko:()=>{ tone(300,.3,'triangle',.18,70); noise(.25,.12,300,.6); },
    lost:()=>{ tone(440,.2,'sine',.12,330); tone(330,.35,'sine',.12,262,.18); tone(262,.6,'sine',.1,196,.45); },
    level:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.16,'triangle',.11,null,i*.08)),
    heal:()=>[660,880,990].forEach((f,i)=>tone(f,.18,'sine',.08,null,i*.09)),
    turn:()=>{ tone(392,.12,'triangle',.09); tone(523,.16,'triangle',.09,null,.1); },
    foeturn:()=>{ tone(330,.12,'triangle',.09); tone(247,.2,'triangle',.09,null,.1); },
    go:()=>{ tone(262,.1,'triangle',.1); tone(392,.1,'triangle',.1,null,.08); tone(523,.2,'triangle',.12,null,.16); },
    visit:()=>{ tone(988,.07,'square',.05); tone(1319,.14,'square',.05,null,.06); },
    raze:()=>{ noise(.5,.25,400,.5); tone(120,.5,'sawtooth',.06,50); },
    nope:()=>tone(200,.12,'square',.06,150),
    talk:()=>{ tone(600,.05,'triangle',.05); tone(700,.05,'triangle',.05,null,.06); },
    join:()=>[392,523,659,784].forEach((f,i)=>tone(f,.2,'triangle',.1,null,i*.08)),
    seize:()=>[392,523,659,784,1047,1319].forEach((f,i)=>tone(f,.25,'triangle',.12,null,i*.09)),
    win:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.22,'triangle',.12,null,i*.1)),
    lose:()=>[392,330,262,196].forEach((f,i)=>tone(f,.3,'triangle',.1,null,i*.16))
  }; (S[k]||S.tap)(); }
