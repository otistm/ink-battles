/* Ink Battles: the six chapters, the maps and everything anyone says. */
"use strict";
// map key: . plain  f forest  m hill  ~ water  # cliff  W wall  F fort  T throne  G gate  v village  b bridge  c pillar  1-8 your start squares
const BOOSTS={
  tonic:{name:'Two tonics',text:'Two more tonics for this battle.'},
  might:{name:'Ink of Might',stat:'str',n:2},
  iron:{name:'Ink of Iron',stat:'def',n:2},
  wind:{name:'Ink of Wind',stat:'spd',n:2},
  life:{name:'Ink of Life',stat:'hp',n:7},
  wit:{name:'Ink of Wit',stat:'mag',n:2},
  luck:{name:'Ink of Luck',stat:'lck',n:3}
};
const CHAPTERS=[
  {id:'c1',name:'Smoke over Vellum',place:'Vellum, the river road',goal:{kind:'boss'},joins:['wren','bram','maud'],
   map:['m.fF.fmm','.f....f.','...v..f.','f.m.....','...f..f.','~~b~~~.~','..f.....','.f..m.f.','v......f','..2..f..','...1.3..'],
   villages:{'3,2':{give:'might',line:'You chased them off? Take this. My late husband swore by it.'},'0,8':{give:'tonic',line:'Bless you, young lord. We saved these for a bad day.'}},
   foes:[{cls:'brigand',lv:1,x:5,y:6},{cls:'fighter',lv:1,x:1,y:3},{cls:'brigand',lv:2,x:6,y:2,w:'handaxe',ai:'guard'},{cls:'fighter',lv:1,x:4,y:1,ai:'guard'},
     {cls:'brigand',lv:3,x:3,y:0,ai:'hold',boss:{name:'Grub',add:{hp:8,str:2,skl:2,def:2},line:'Vellum’s quills burn nice and slow. You’re next, pup.'}}],
   intro:[['maud','Wren. Wake up. The mill is on fire.'],['wren','Brigands again?'],['bram','Grub’s gang. They came down from the hills an hour ago.'],['wren','Then we stop them at the river.'],['maud','Your father never rode out with just two of us.'],['wren','Father isn’t here. Bram, take the front. Maud, stay behind me.']]},

  {id:'c2',name:'Road of Reeds',place:'The gate on the reed road',goal:{kind:'seize'},joins:['tess','pim'],
   map:['mm.WGW.m','m...f...','..ff...f','f....F..','...m....','.f...ff.','....f..v','.ff.....','......f.','.2.4..3.','..1..5..'],
   villages:{'7,6':{give:'wind',line:'Riders from the capital came through last night. One left this.'}},
   foes:[{cls:'soldier',lv:2,x:1,y:3},{cls:'archer',lv:2,x:5,y:3,ai:'guard'},{cls:'brigand',lv:2,x:6,y:1,w:'handaxe'},{cls:'merc',lv:2,x:2,y:5},{cls:'soldier',lv:3,x:4,y:1,w:'javelin',ai:'guard'},{cls:'cav',lv:2,x:2,y:2},
     {cls:'knight',lv:4,x:4,y:0,ai:'hold',boss:{name:'Sir Ledger',add:{hp:6,str:1,def:2},line:'This gate is closed by order of the King. The Smudge King.'}}],
   intro:[['tess','Riders from the capital, my lord. What is left of them.'],['wren','The capital fell?'],['tess','The Smudge King’s ink took it in one night. Every banner turned black.'],['pim','We ran. Now Ledger’s men hold the gate on the reed road.'],['wren','Then we take the gate. Ride with us.']]},

  {id:'c3',name:'A Blade for Hire',place:'Harrow’s camp in the old town',goal:{kind:'rout'},joins:['oda'],
   map:['..f..m..','.vW..W..','..W..Wf.','f.......','..WW.f..','.....W.v','.f......','...ff...','W......W','.2.4.6..','..1.3.5.'],
   villages:{'1,1':{give:'life',line:'Harrow took our bread. You can have our medicine.'},'7,5':{give:'iron',line:'An old smith lived here. He’d want this used.'}},
   foes:[{cls:'merc',char:'cass',x:3,y:3,ai:'guard',talk:'cass'},{cls:'fighter',lv:4,x:0,y:3},{cls:'brigand',lv:3,x:7,y:1,w:'handaxe',ai:'guard'},{cls:'fighter',lv:3,x:4,y:5},{cls:'archer',lv:3,x:6,y:2,ai:'guard'},{cls:'soldier',lv:4,x:1,y:6},{cls:'mage',lv:3,x:4,y:1,ai:'guard'},
     {cls:'cav',lv:6,x:3,y:0,ai:'hold',boss:{name:'Captain Harrow',add:{hp:6,str:2,def:1},line:'Cass! Earn your pay and cut them down!'}}],
   talks:{cass:[['wren','Cass! You don’t have to fight for Harrow.'],['cass','He pays. Do you?'],['wren','Not much. But when this is over, nobody will have to sell their sword again.'],['cass','That is a terrible deal.'],['cass','I’ll take it.']]},
   intro:[['oda','You’re the kid who beat Grub? I’ll swing an axe for you. The food’s better than in the hills.'],['pim','Careful. There’s a mercenary with Harrow’s lot. Cass. Best blade in the south.'],['wren','Mercenaries fight for coin. Maybe I can make a better offer.']],
   tip:'Move Wren next to Cass and tap Talk. She might switch sides.'},

  {id:'c4',name:'Marrow Lake',place:'The south shore of Marrow Lake',goal:{kind:'survive',turns:7},joins:['kes','lune'],
   map:['f..ff..f','.f....f.','~~~..~~~','~~~bb~~~','~~~bb~~~','~f....f~','~..mm..~','..f..f..','.F....F.','.2.46.3.','..1.57..'],
   foes:[{cls:'soldier',lv:4,x:3,y:0},{cls:'soldier',lv:4,x:4,y:0,w:'javelin'},{cls:'archer',lv:4,x:1,y:1},{cls:'mage',lv:3,x:6,y:1},{cls:'peg',lv:4,x:0,y:0},{cls:'cav',lv:4,x:2,y:0},
     {cls:'peg',lv:8,x:4,y:1,ai:'guard',boss:{name:'Wing-Captain Ash',add:{hp:6,str:2,skl:2},line:'Pretty sky today. Shame about the arrows.'}}],
   reinf:[{turn:2,cls:'peg',lv:3,x:7,y:0},{turn:2,cls:'soldier',lv:3,x:4,y:0},{turn:3,cls:'brigand',lv:4,x:0,y:0,w:'handaxe'},{turn:3,cls:'archer',lv:3,x:7,y:1},
     {turn:4,cls:'cav',lv:4,x:3,y:0},{turn:4,cls:'peg',lv:4,x:0,y:1},{turn:5,cls:'fighter',lv:4,x:4,y:0},{turn:5,cls:'mage',lv:3,x:7,y:0},{turn:6,cls:'knight',lv:4,x:3,y:0},{turn:6,cls:'merc',lv:4,x:5,y:0}],
   intro:[['kes','Kestrel of the lake watch, at your service. We’ve held this shore for three days.'],['lune','And I’ve set half the reeds on fire doing it. They keep coming.'],['wren','How long until the ferry lands?'],['kes','Seven turns of the watch. Hold until then and we all sail.']],
   tip:'Survive seven turns. The forts mend anyone standing on them. Keep Kestrel away from archers.'},

  {id:'c5',name:'The Grey Keep',place:'The Grey Keep',goal:{kind:'seize'},joins:[],
   map:['W.c.T.cW','W......W','WWW..WWW','f..c..cf','........','.WW..WW.','.W....W.','...ff...','F......F','.2.46.3.','8.1.57..'],
   foes:[{cls:'knight',lv:5,x:3,y:2,ai:'guard'},{cls:'knight',lv:5,x:4,y:2,ai:'guard'},{cls:'archer',lv:5,x:1,y:1,ai:'guard'},{cls:'mage',lv:5,x:6,y:1,ai:'guard'},{cls:'cleric',lv:4,x:2,y:1},
     {cls:'soldier',lv:5,x:1,y:4,w:'javelin'},{cls:'merc',lv:5,x:6,y:4},{cls:'cav',lv:5,x:0,y:3},{cls:'fighter',lv:5,x:7,y:6},{cls:'archer',lv:4,x:2,y:6},
     {cls:'general',lv:8,x:4,y:0,w:'javelin',ai:'hold',boss:{name:'General Pale',add:{hp:8,str:1,skl:2},line:'Bram. You were my best student. Stand aside.'}}],
   reinf:[{turn:4,cls:'cav',lv:4,x:0,y:4},{turn:4,cls:'cav',lv:4,x:7,y:4},{turn:6,cls:'peg',lv:4,x:0,y:5}],
   intro:[['bram','The Grey Keep. I trained here, before the ink came.'],['wren','Who holds it now?'],['bram','General Pale. My old commander. He won’t yield.'],['wren','Then we take the throne from him. Seize it and the keep is ours.']]},

  {id:'c6',name:'The Smudge King',place:'The black throne room',goal:{kind:'boss'},joins:[],
   map:['W..cTc.W','W......W','W.c..c.W','W......W','WW.WW.WW','........','.f.~~.f.','...~~...','.F....F.','.2.46.3.','8.1.57..'],
   foes:[{cls:'general',lv:7,x:2,y:4,ai:'guard'},{cls:'knight',lv:8,x:5,y:4,ai:'guard'},{cls:'mage',lv:7,x:1,y:1,w:'thunder',ai:'guard'},{cls:'mage',lv:7,x:6,y:1,w:'thunder',ai:'guard'},
     {cls:'archer',lv:7,x:2,y:2,ai:'guard'},{cls:'peg',lv:7,x:0,y:5},{cls:'cav',lv:7,x:7,y:5},{cls:'merc',lv:7,x:3,y:3,w:'killer',ai:'guard'},{cls:'cleric',lv:6,x:4,y:1},
     {cls:'sorc',lv:12,x:4,y:0,ai:'hold',boss:{name:'The Smudge King',add:{hp:8,skl:2,def:2},line:'Every page ends in ink, little lord. I am only the ending.'}}],
   reinf:[{turn:3,cls:'brigand',lv:6,x:0,y:5,w:'handaxe'},{turn:3,cls:'brigand',lv:6,x:7,y:5,w:'handaxe'},{turn:5,cls:'peg',lv:6,x:0,y:6},{turn:5,cls:'peg',lv:6,x:7,y:6}],
   intro:[['maud','The last room. Can you hear it? The ink is breathing.'],['cass','I’ve been paid in stranger ways. Let’s finish this.'],['wren','Everyone comes home tonight. That is an order.']]}
];
const EPILOGUE=[['wren','The banners are white again.'],['maud','Paper and ink. Your father used to say that is all a kingdom is.'],['wren','Then we write a better one.']];

if(typeof module!=='undefined') module.exports={CHAPTERS,BOOSTS,EPILOGUE};
