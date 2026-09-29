// Rough balance check: a greedy bot plays your side with the enemy's own brain.
// It is far worse than a person, so a chapter it wins now and then is fair for a player.
// Run: node test/sim.js [runs]
const R=require('../src/rules.js');
const {CHAPTERS}=require('../src/story.js');
const runs=+process.argv[2]||300;

function play(ch,roster,rng){
  const slots=ch.map.join('').replace(/[^1-9]/g,'').length;
  const deploy=['wren'].concat(roster.filter(r=>r.id!=='wren').sort((a,b)=>b.lv-a.lv).map(r=>r.id)).slice(0,slots);
  const B=R.makeBattle(ch,roster,deploy);
  const oldRandom=Math.random; Math.random=rng;
  try{
    for(let turn=1;turn<=30;turn++){
      B.turn=turn; R.terrainHeal(B,'ally');
      for(const u of R.alive(B,'ally')){
        if(u.hp<=0) continue;
        // the lord plays it safe until the boss is weak or the throne is near
        const home={x:u.x,y:u.y}, p=R.plan(B,u); u.x=p.x; u.y=p.y;
        // a careful player doesn't end a turn where three or more foes can reach, unless it wins the fight outright
        const foes=R.alive(B,'enemy').filter(e=>R.threat(B,e).has(R.key(u.x,u.y))).length;
        const kills=p.target&&R.forecast(B,u,p.target,u.x,u.y).A.dmg*(R.forecast(B,u,p.target,u.x,u.y).A.x2?2:1)>=p.target.hp;
        if(!p.heal&&!p.target&&ch.goal.kind==='survive'){ u.x=home.x; u.y=home.y; continue; }
        if(!p.heal&&foes>=(u.charId==='wren'?2:3)&&!kills){ u.x=home.x; u.y=home.y; continue; }
        if(p.heal){ p.target.hp=Math.min(p.target.maxhp,p.target.hp+R.healAmt(u)); continue; }
        if(p.target){ R.resolve(B,u,p.target,rng); }
        if(ch.goal.kind==='seize'&&u.charId==='wren'&&/[TG]/.test(R.tAt(B,u.x,u.y))) B.seized=true;
        const o=R.outcome(B); if(o) return o;
      }
      R.dueReinf(B); R.terrainHeal(B,'enemy');
      for(const e of R.alive(B,'enemy')){
        const p=R.plan(B,e); e.x=p.x; e.y=p.y;
        if(p.heal){ p.target.hp=Math.min(p.target.maxhp,p.target.hp+R.healAmt(e)); continue; }
        if(p.raze) B.map[e.y][e.x]='x';
        if(p.target) R.resolve(B,e,p.target,rng);
        const o=R.outcome(B); if(o) return o;
      }
      if(ch.goal.kind==='survive'&&turn>=ch.goal.turns) return 'win';
    }
    return 'timeout';
  } finally { Math.random=oldRandom; }
}

let seed=1; const rng=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
CHAPTERS.forEach((ch,i)=>{
  const res={win:0,lose:0,timeout:0};
  for(let n=0;n<runs;n++){
    // a roster at the level a player would likely have by now
    const ids=[...new Set(CHAPTERS.slice(0,i+1).flatMap(c=>c.joins).concat(i>=3?['cass']:[]))];
    const roster=ids.map(id=>{ const r=R.newRecord(id); const want=Math.max(r.lv,[1,3,5,7,9,11][i]+(id==='wren'?1:0)); while(r.lv<want) R.levelUp(r,rng); return r; });
    res[play(ch,roster,rng)]++;
  }
  console.log(`${ch.name.padEnd(20)} bot wins ${Math.round(res.win/runs*100)}%  loses ${Math.round(res.lose/runs*100)}%  stalls ${Math.round(res.timeout/runs*100)}%`);
});
