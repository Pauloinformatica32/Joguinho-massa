# Warden: giant shockwaves and chest cannon

Implemented in js/warden.js, js/combat-debug.js and js/engine.js, with anchor metadata
in assets/bosses/warden/config.json. Sprite PNGs, movement physics, map, camera,
boss rewards and save schema are unchanged.

## Measured movement
Measurements use createPlayer/updatePlayer/moveBody, a 30x54 player, -660 normal
jump, -590 second jump, gravity 1850, and the actual discrete integration.
Heights measure the player's feet above the takeoff floor.

| FPS | Normal apex | Maximum double apex | Second jump after takeoff |
| --- | ---: | ---: | ---: |
| 30 | 106.9444 | 191.4444 | .3333 s |
| 60 | 112.2917 | 201.4861 | .3500 s |
| 120 | 114.9896 | 206.6250 | .3500 s |

The continuous estimate of 117.73 is not reached by this integrator. Phase 1 uses
100 rather than 105, leaving 6.94 units of clearance at 30 FPS.

## Final waves (WARDEN_COMBAT)
| Phase | Width | Height | Speed | Maximum travel |
| --- | ---: | ---: | ---: | ---: |
| 1 | 64 | 100 | 560/s | 620 |
| 2 | 96 | 180 | 660/s | 670 |

Lifetime is distance/solid/arena limited, with no old short timeout. Waves remain
floor anchored and recovery waits for their removal. Full visible bodies, bright
outlines, leading fronts, moving fracture fragments and trailing sparks share the
moving hitboxes. Main bodies have no invisible extra height.

Trajectory tests search encounter timing at .01 s increments while Kael runs
toward the wave at 250/s. Successful encounter-center times after first jump:
- 30 FPS: phase 1 .30–.37 s; phase 2 .57–.69 s.
- 60 FPS: phase 1 .28–.40 s; phase 2 .57–.74 s.
- 120 FPS: phase 1 .29–.42 s; phase 2 .57–.77 s.
Both facings pass. Phase 2 has zero normal-jump successes; low/standing trajectories
collide. These are tested windows for that movement pattern, not every possible
player approach. Jumping toward the crest is the intended solution.

## Core, hammer and laser geometry
Phase 2 idle core source coordinate: (145,65) in a 256x256 frame.
Sprite origin: (128,251), configured scale .47, native facing -1.
Renderer rounds the destination to 120x120: anchor conversion uses 120/256,
the same destination origin, visual offsets, native-facing mirror and charge tilt.
Phase 2 slam has per-frame reactor anchors. Phase 1 hammer ground contact uses
(24,116), impact frame 3; Phase 2 uses (40,251), impact frame 4 (zero based).
The state switches to the impact frame and emits both waves exactly once together.
The deformed Phase 2 frame 3 remains skipped.

At normal floor y=790 and boss height 112, the idle core is at y=702.46875,
87.53125 above the floor. At spawn x=4910, its x is 4929.96875 facing left,
4954.03125 facing right. These are calculated, never hardcoded in beam geometry.

The laser starts at the core x and runs only in the locked facing direction to
WARDEN_ARENA.left/right. It is horizontal, with asymmetric thickness:
4 above the reactor, 46 below, total 50. At normal stance its vertical bounds
are y=698.46875–748.46875. Standing Kael occupies y=736–790, so he is threatened.
The bright core stripe starts at the reactor; the lower body is visibly filled.
The warning shades and outlines the entire dangerous volume, not just its center.
Warning 1.15 s, active .18 s, recovery 1.1 s. A normal jump .25 s before firing
clears the complete active interval at every tested FPS. Double jump also remains
available. Afterglow lasts .14 s and retains the original core and geometry, with
no collision. Telegraph, recovery, death and respawn do not retain active damage.
F3 shows wave dimensions, beam thickness and exact reactor anchor.

## Arena and progression
Arena remains x=4490–5160 (670 wide), floor 790; no new gates, checkpoints or save
migration are necessary. The floor and headroom are clear; existing camera frames
the whole arena on the default 960-wide canvas and existing gates clamp combatants.
The arena already supports the tested crossing trajectories. A larger map was
not needed. Matrona's act reward grants doubleJump; checkGates prevents entry into
the factory before that victory, and syncProgress restores earned abilities.

## Validation
Passed tests/warden-rework.mjs (actual trajectory sweeps, both facings, hammer
event/anchors, thin/low jump failure, core laser bounds, grounded damage, normal
jump escape, single hit, cleanup, charge reaching wall and blast recovery).
Passed tests/warden.mjs, campaign.mjs, matrona.mjs, factory.mjs, combat.mjs,
dash.mjs and player-animation.mjs. Campaign covers Vespera, progression and saves.
git diff --check passed.

Remaining manual browser checks: sprite-to-effect visual synchronization during
play, F3 clarity, soundless telegraph readability, camera on narrow viewports, and
full fight balance for close-range commitments. Sprite sheets were inspected
directly; no new browser gameplay validation is claimed.

## Phase 2 selection balance
Selection uses WARDEN_PHASE2_SELECTION: slam 45, laser (discharge key) 35, charge 20.
Weights are normalized over eligible attacks. When charge is blocked, slam is
56.25% and laser 43.75%. Distance does not alter or override Phase 2 selection;
Phase 1 retains its prior selection behavior.

After each charge selection, both slam and laser must be selected before the
next charge. Repeating one alternative does not satisfy this requirement.
A separate 10-second cooldown starts at the end of the active collision blast,
and counts down in simulation seconds through recovery and subsequent attacks.
No recovery durations or attack geometry were changed.

Selection state is initialized at boss creation and reset on respawn, transition
and defeat. It is independent of animation state and not restored from old saves.

tests/warden-selection.mjs passed 450 live selections at 30/60/120 FPS, alternating
close, medium and far targets on both sides, plus 40,000 seeded weighted samples.
Live results: 204 slam, 184 laser, 62 charge (45.3%, 40.9%, 13.8%).
The eligible-only sample measured 44.87% / 35.06% / 20.08%; restrictions deliberately
reduce the realized charge frequency. No consecutive charges, cooldown bypasses,
missing distinct intervening attacks or selection deadlocks occurred.
Warden, giant-wave/core-laser and campaign regression suites passed.
