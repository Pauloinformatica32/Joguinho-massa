# Tower visibility verification

Status: H-0 and NEXUS-01 corrected and visually verified locally. I-9 animation verified, but the reported freeze was not reproduced and no distinct replacement PNGs were found. Do not treat all three requested fixes as completed.

## I-9

The current walk/attack PNGs decode at 1280×192 and match the corresponding files in Torre_Aurora_3_Inimigos_Sprites byte for byte (existing test compares SHA-256). Idle was preserved. No art was regenerated or replaced. The actual RAF/Engine.update/World.draw/renderEnemy/renderTowerEnemy path produced all eight walking and attacking frames at normal speed. Frame selection already uses simulation time, with explicit frameOverride; repeated draws do not advance it. Movement determines walk selection. Existing impact frame 4, facing and collision rules remain unchanged. Walking art has subtle pose changes; that is an observation, not proof of the recorded freeze's cause.

Evidence: gameplay-i9.webm records the actual game canvas; gameplay-i9-attack.png, gameplay-i9-chase.png and gameplay-i9-walk.png show live states. Browser atlas verification checks both directions and all source rectangles. A separately supplied newer set of PNGs would be needed to perform a distinct replacement.

## H-0

The original X=10050 and X=11700 slots were on the ground below the elevated partition traversal. Neither was inside a solid, but both could be missed while traversing above. Existing IDs are retained; there are still seven tower enemies, including exactly two H-0s. They now patrol X=10525–10590 (spawn 10560) and X=11800–11970 (spawn 11900), Y=730, feet at floor Y=790. These positions are before the two mandatory EMP barriers, next to their panels, after the partitions. No barrier, terminal or elevator requirement changed.

The first encounter displays PROTÓTIPO SINÁPTICO H-0 for three seconds. The browser scenario walks from the laboratory hazard exit into the encounter with normal movement input; H-0 is alive, activates, and attacks. gameplay-h0-approach.png and gameplay-h0-fight.png show the name and discharge. Both patrol bounds are verified against current solid floor support. A full campaign traversal and a separate visual fight with the second H-0 were not performed.

## NEXUS-01

Fresh Véspera objects lacked facing. updateDrone multiplied undefined facing by the follow offset, making targetX and then drone.x NaN. Subsequent interpolation could never recover. Isolated sprite tests and fixtures that started an attack first did not expose this lifecycle fault.

resetVespera initializes facing, updateDrone validates facing and recovers legacy nonfinite coordinates. The same drone object/controller is retained. The follow offset is 58 world pixels toward Kael and 112 above the floor, avoiding the outer screen edge and Véspera's silhouette. Source PNG remains unchanged; scale increased from .55 to .85 (approximately 46×41 pixels). Nearest-neighbor rendering remains active, with a restrained cyan/red glow. Commands, projectiles from drone coordinates, return interpolation, EMP disable/recovery and shutdown rules remain intact.

The actual arena boundary/intro was used before explicit attack/phase/EMP scenarios. Evidence: gameplay-nexus-start.png, gameplay-nexus-follow.png, gameplay-nexus-command.png, gameplay-nexus-phase2.png, gameplay-nexus-emp-recovered.png; gameplay-nexus-debug-phase2.png also exercises towerTest. All were inspected visually. The final gameplay run recorded 497 successful drone draws, zero invalid coordinates/draw failures, available('nexus01','idle') true, 31 loaded images, zero asset errors. Asset paths/loading registration were already correct. Later world passes were inspected and did not obscure the drone.

## Validation

- node tests/tower-enemies.mjs: 232 checks passed, 30/60/120 FPS.
- node tests/vespera.mjs: 3802 checks passed, including fresh idle encounters and NaN recovery.
- Browser tower-enemies: 176 checks passed.
- Browser vespera: 72 checks passed. Its legacy returned drone dimension field is hardcoded to 30×26; the actual config/render scale is .85.
- Browser gameplay: passed; all eight I-9 walk/attack frames, live H-0 attack, valid drone rendering, normal RAF timing; results saved in tower-gameplay-results.json.
- Tower traversal/storage: 27 checks passed.
- Combat: 159 checks passed.
- Cybernetics: 111 checks passed.
- Campaign: passed, including bosses, gates, checkpoints and legacy-save migrations.
- git diff --check: passed (line-ending notices only).

Verification uses an isolated browser context and localhost-only devTowerTest (save writes disabled). Starting positions, phase and EMP scenarios are controlled. This is not a complete normal campaign playthrough. No commit or push was made.

## Modified and added files

Runtime: assets/bosses/vespera/drone/config.json; js/vespera.js; js/tower-enemies.js; js/main.js (engine exposed only inside existing localhost towerTest).

Tests: tests/tower-enemies.mjs; tests/vespera.mjs; tests/browser-tower-gameplay.mjs.

Evidence: tests/tower-enemies-atlas-preview.png; tests/vespera-atlas-preview.png; tests/gameplay-i9.webm; tests/gameplay-i9-attack.png; tests/gameplay-i9-chase.png; tests/gameplay-i9-walk.png; tests/gameplay-h0-approach.png; tests/gameplay-h0-fight.png; tests/gameplay-nexus-start.png; tests/gameplay-nexus-follow.png; tests/gameplay-nexus-command.png; tests/gameplay-nexus-phase2.png; tests/gameplay-nexus-emp-recovered.png; tests/gameplay-nexus-debug-phase2.png; tests/tower-gameplay-results.json; tests/tower-visibility-report.md.
