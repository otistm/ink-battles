# Ink Battles

A turn-based strategy RPG in the Ink series. It uses the same paper-and-ink look as Ink Legion and Ink of Arms: white paper, black ink, Fraunces and Figtree, hard offset shadows and springy motion. There are no other colors, so patterns carry the information.

Lead Wren, heir to the quill town of Vellum, and a small band against the Smudge King across six chapters.

## Play

Open `index.html` in a browser. It is one self-contained file and works best on a phone held upright.

- Tap a unit, tap a square to move, then pick an action: Attack, Heal, Talk, Visit, Seize, Tonic or Wait.
- Tap an enemy to see where it can reach. Tap **Danger** to see every square the enemy can hit next turn.
- Before each attack, the dock shows a forecast of HP, damage, hit and crit for both sides.

## Rules

- **Weapon triangle**: swords beat axes, axes beat lances, lances beat swords. The winner gets +1 might and +15 hit. Units wear their weapon: solid ink for swords, hatching for lances, dots for axes.
- **Speed**: four more speed than your foe means you strike twice.
- **Bows** only hit from two squares away and deal triple might against fliers. Wren's **Quill Blade** deals triple might against armor and horses.
- **Hit** uses two rolls averaged, so high odds land more often than they read and low odds less often. **Crits** do triple damage.
- **Terrain**: forests, hills, forts, thrones and pillars add avoid and defense. Forts and thrones heal 20% at the start of your phase. Knights can't climb hills, horses slog through forests, and fliers cross water.
- **Villages** give gifts if you visit them. Brigands burn the ones you don't reach in time.
- **Experience**: 100 exp is a level. Each stat rolls against that character's growth rate, and a level never comes up empty.
- **Permadeath**: on Classic, anyone who falls is gone for good. On Casual, fallen units come back next chapter. If Wren falls, the battle is lost.

## Chapters

| # | Chapter | Goal | Joins |
|---|---------|------|-------|
| 1 | Smoke over Vellum | Defeat Grub | Wren, Bram, Maud |
| 2 | Road of Reeds | Seize the gate | Tess, Pim |
| 3 | A Blade for Hire | Defeat every enemy | Oda, and Cass if Wren talks to her |
| 4 | Marrow Lake | Survive 7 turns | Kestrel, Lune |
| 5 | The Grey Keep | Seize the throne | |
| 6 | The Smudge King | Defeat the Smudge King | |

## Develop

The game is written in `src/` and built into `index.html`:

```
node build.js          # inline src/ into index.html
node --test test/      # rules and map checks
node test/sim.js 300   # rough balance check: a greedy bot plays every chapter
```

- `src/rules.js`: combat, movement, level-ups, enemy AI. Pure logic with no drawing.
- `src/story.js`: the six maps, enemies, villages, and all dialogue.
- `src/art.js`: every unit and horse, drawn in code on canvas.
- `src/board.js`: map drawing, taps, the dock, combat animation, turn flow.
- `src/campaign.js`: save file, title, deployment, camp, ending.
- `src/style.css`, `src/sound.js`, `src/shell.html`.

Progress saves to `localStorage` in the browser.
