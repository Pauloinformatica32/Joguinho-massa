# Warden arena movement layout

World coordinates, floor y=790. Arena boundaries remain x=4490..5160 (670 wide);
boss spawn x=4910. No regional expansion, checkpoint/save migration or gate changes.

| Deck | x | y | width | height |
| --- | ---: | ---: | ---: | ---: |
| Approach | 4405 | 714 | 70 | 16 |
| Left | 4545 | 700 | 100 | 16 |
| Center | 4770 | 660 | 110 | 16 |
| Right | 5010 | 690 | 95 | 16 |

All decks are one-way. The three combat decks reuse the existing unstable-platform
cycle: .65 s occupied warning then 4 s absent, reset on respawn. They use procedural
steel grating, rust trim and red warning lights. There are no solid support bodies
in the charge lane. All combat decks are below the top of the 180-unit Phase 2
wave, so standing on them does not make that wave harmless. Center deck clears
the Phase 1 wave temporarily; its collapse prevents permanent camping.

Industrial hook devices: (4660,500), (4970,480). Both use the existing 380-unit
range and ballistic hook impulse. Only these two nodes have a 3-second recharge;
legacy nodes behave unchanged. Selection, activation and ready rendering agree
about recharge state. Modules display metal rails, suspension cables, warning
lamps and a red recharge indicator. No new sprites are used.

Existing camera/arena clamps are reused. Both anchors and their rails fit the
default 960x540 arena view. Warden gate lighting now spans the usable airspace;
collision still clamps players at any altitude. Default arena framing is unchanged.

Validation:
- tests/warden-arena.mjs at 30/60/120 FPS: every deck reachable with real jumps,
  both hooks selectable and usable from floor, return to floor, recharge/reset,
  platform collapse/restore, hook laser dodge, Warden charge to both walls without
  landing on decks, player lock at height, and camera anchor visibility.
- Existing Warden, selection, campaign, factory and dash suites passed.
- Flat-floor Warden attack trajectory benchmarks passed; new arena routes are
  checked separately rather than treating new decks as empty ground.
- Chrome browser test tests/browser-warden-arena.mjs ran the actual Engine hook
  action/update loop, loaded/rendered assets and captured layout, hook ascent and
  center-deck screenshots without JS exceptions. Measured hook rise: 293.24.
- Captures were visually inspected. This was automated browser gameplay, not
  a human keyboard playthrough. Full-fight subjective difficulty and narrow-screen
  readability still benefit from human playtesting.

Changed gameplay files: js/map.js, js/world.js, js/hook.js, js/level-platforms.js.
Added arena tests/browser test and this document; updated the existing flat-floor
trajectory test fixture. Combat sprites, Warden attack values and other arenas
are unchanged.
