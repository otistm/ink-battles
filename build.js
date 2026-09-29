// Inlines src/ into one self-contained page, the way every Ink game ships.
// Run: node build.js
const fs=require('fs'), path=require('path');
const src=f=>fs.readFileSync(path.join(__dirname,'src',f),'utf8');
const js=['rules.js','story.js','art.js','sound.js','board.js','campaign.js'].map(src).join('\n');
const html=src('shell.html').replace('/*STYLE*/',()=>src('style.css').trim()).replace('/*SCRIPT*/',()=>js.trim());
fs.writeFileSync(path.join(__dirname,'index.html'),html);
console.log('index.html',Math.round(html.length/1024)+'KB');
