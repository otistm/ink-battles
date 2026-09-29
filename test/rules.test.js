const test=require('node:test');
const assert=require('node:assert');
const R=require('../src/rules.js');
const {CHAPTERS,BOOSTS}=require('../src/story.js');

const fixed=v=>()=>v;

test('every map is 8 by 11 with only known squares',()=>{
  for(const ch of CHAPTERS){
    assert.strictEqual(ch.map.length,11,ch.id);
    ch.map.forEach((row,y)=>{
      assert.strictEqual(row.length,8,`${ch.id} row ${y}`);
      for(const c of row) assert.ok(R.TERRAIN[c]||/[1-9]/.test(c),`${ch.id} has unknown square ${c}`);
    });
  }
});

test('every enemy stands on a square it could walk on, and on its own square',()=>{
  for(const ch of CHAPTERS){
    const seen=new Set();
    for(const f of ch.foes.concat(ch.reinf||[])){
      const c=ch.map[f.y][f.x];
      assert.ok(isFinite(R.moveCost(R.CLASSES[f.cls].move,c)),`${ch.id} ${f.cls} at ${f.x},${f.y} is on ${c}`);
      if(f.turn) continue;
      assert.ok(!seen.has(f.x+','+f.y),`${ch.id} two foes at ${f.x},${f.y}`); seen.add(f.x+','+f.y);
    }
    for(const k of Object.keys(ch.villages||{})){ const [x,y]=k.split(',').map(Number); assert.strictEqual(ch.map[y][x],'v',`${ch.id} village ${k}`); assert.ok(BOOSTS[ch.villages[k].give]); }
    if(ch.goal.kind==='seize') assert.ok(ch.map.some(r=>/[TG]/.test(r)),`${ch.id} has nothing to seize`);
    if(ch.goal.kind==='boss') assert.ok(ch.foes.some(f=>f.boss),`${ch.id} has no boss`);
  }
});

test('the weapon triangle turns the right way',()=>{
  const u=w=>({wpn:w});
  assert.strictEqual(R.tri(u('sword'),u('axe')),1);
  assert.strictEqual(R.tri(u('axe'),u('lance')),1);
  assert.strictEqual(R.tri(u('lance'),u('sword')),1);
  assert.strictEqual(R.tri(u('axe'),u('sword')),-1);
  assert.strictEqual(R.tri(u('bow'),u('sword')),0);
  assert.strictEqual(R.tri(u('fire'),u('lance')),0);
});

function duel(a,b,map){
  const B={map:(map||['....','....']).map(r=>r.split('')),w:4,h:2,units:[]};
  a=R.makeUnit(Object.assign({id:'a',team:'ally',x:0,y:0,lv:1},a)); b=R.makeUnit(Object.assign({id:'b',team:'enemy',x:1,y:0,lv:1},b));
  B.units.push(a,b); return {B,a,b};
}
const S=(o)=>Object.assign({cls:'merc',hp:20,str:5,mag:0,skl:5,spd:5,lck:0,def:2,res:0},o);

test('the forecast matches the formulas',()=>{
  const {B,a,b}=duel(S({wpn:'sword'}),S({wpn:'axe',cls:'fighter'}));
  const f=R.forecast(B,a,b,0,0);
  // sword into axe: +1 might, +15 hit
  assert.strictEqual(f.A.dmg,5+5+1-2);
  assert.strictEqual(f.A.hit,Math.min(100,90+10+0+15-10));
  assert.strictEqual(f.D.dmg,5+8-1-2);
  assert.strictEqual(f.D.hit,75+10-15-10);
  assert.strictEqual(f.A.x2,false);
});

test('forest adds dodge and defense to the one standing in it',()=>{
  const {B,a,b}=duel(S({wpn:'sword'}),S({wpn:'sword'}),['.f..','....']);
  const f=R.forecast(B,a,b,0,0);
  assert.strictEqual(f.A.dmg,5+5-2-1);
  assert.strictEqual(f.A.hit,90+10-(10+20));
});

test('four more speed hits twice, and bows cannot answer up close',()=>{
  const {B,a,b}=duel(S({wpn:'sword',spd:9}),S({wpn:'bow',cls:'archer'}));
  const f=R.forecast(B,a,b,0,0);
  assert.strictEqual(f.A.x2,true); assert.strictEqual(f.D,null);
});

test('the Quill Blade triples its might against knights, bows against fliers',()=>{
  let {B,a,b}=duel(S({wpn:'quill'}),S({cls:'knight',wpn:'lance',def:9}));
  assert.strictEqual(R.forecast(B,a,b,0,0).A.dmg,5+(6-1)*3-9);
  ({B,a,b}=duel(S({wpn:'bow',cls:'archer'}),S({cls:'peg',wpn:'lance'})));
  b.x=2; assert.strictEqual(R.forecast(B,a,b,0,0).A.dmg,5+6*3-2);
});

test('a fight resolves in order and stops when someone falls',()=>{
  const {B,a,b}=duel(S({wpn:'sword',str:30,spd:20}),S({wpn:'axe',cls:'fighter'}));
  const seq=R.resolve(B,a,b,fixed(0));
  assert.strictEqual(seq.length,1); assert.ok(seq[0].kill); assert.strictEqual(b.hp,0);
});

test('a crit does triple damage',()=>{
  const {B,a,b}=duel(S({wpn:'killer',hp:40}),S({wpn:'sword',hp:60}));
  const f=R.forecast(B,a,b,0,0);
  R.resolve(B,a,b,fixed(0));
  assert.strictEqual(b.hp,60-f.A.dmg*3);
});

test('a level always gains at least one stat and respects caps',()=>{
  const r=R.newRecord('bram');
  const g=R.levelUp(r,fixed(.999));
  assert.strictEqual(Object.values(g).reduce((s,v)=>s+v,0),1);
  assert.strictEqual(g.hp,1);
  const w=R.newRecord('wren'); w.str=30; const g2=R.levelUp(w,fixed(0)); assert.strictEqual(g2.str,0); assert.strictEqual(w.str,30);
});

test('knights cannot climb hills, fliers cross water, nobody crosses walls',()=>{
  assert.strictEqual(R.moveCost('armor','m'),Infinity);
  assert.strictEqual(R.moveCost('horse','f'),3);
  assert.strictEqual(R.moveCost('fly','~'),1);
  assert.strictEqual(R.moveCost('fly','W'),Infinity);
});

test('battles build from the roster and the lord comes first',()=>{
  const roster=['wren','bram','maud'].map(R.newRecord);
  const B=R.makeBattle(CHAPTERS[0],roster,['wren','bram','maud']);
  const w=B.units.find(u=>u.charId==='wren');
  assert.deepStrictEqual([w.x,w.y],[3,10]);
  assert.strictEqual(R.alive(B,'enemy').length,CHAPTERS[0].foes.length);
  assert.strictEqual(R.outcome(B),null);
  B.units.find(u=>u.boss).hp=0; assert.strictEqual(R.outcome(B),'win');
  w.hp=0; assert.strictEqual(R.outcome(B),'lose');
});

test('brigands head for villages when nobody is in reach',()=>{
  const B=R.makeBattle({map:['v.......','........','........','........','........','........','........','.......1'],foes:[{cls:'brigand',lv:1,x:2,y:0}],goal:{kind:'rout'}},[R.newRecord('wren')],['wren']);
  const p=R.plan(B,B.units.find(u=>u.team==='enemy'));
  assert.ok(p.raze); assert.deepStrictEqual([p.x,p.y],[0,0]);
});

test('enemy healers heal instead of fighting',()=>{
  const B=R.makeBattle({map:['........','........','........','.......1'],foes:[{cls:'cleric',lv:1,x:0,y:0},{cls:'soldier',lv:1,x:3,y:0}],goal:{kind:'rout'}},[R.newRecord('wren')],['wren']);
  const s=B.units.find(u=>u.cls==='soldier'); s.hp=5;
  const p=R.plan(B,B.units.find(u=>u.cls==='cleric'));
  assert.ok(p.heal); assert.strictEqual(p.target,s);
});
