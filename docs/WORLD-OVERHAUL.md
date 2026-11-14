# Nova Aurora — world overhaul

Implemented in the local project. No commit or push was performed. Pre-existing
uncommitted Véspera, tower enemy, sprite and campaign work was retained.

## Architecture inspected

`map.js` builds the continuous world, with `tower-layout.js` providing three
isolated horizontal tower floors. `physics.js` owns collisions; `player.js` and
`hook.js` own movement. `world.js` composes Canvas layers and sprite renderers.
`camera.js`, `tower.js`, `campaign.js` and `save.js` own framing, elevators,
progression and version 1/2 save normalization respectively. Existing enemies
and bosses retain their controllers and authored coordinates.

## Dimensions and routes

The expansion is vertical. Horizontal coordinate bands remain stable for combat,
story and save compatibility. Previously the camera envelope was y=0…900;
it is now y=-720…900. The highest new decks are at y=-350; the additional
headroom accommodates jumps and grapple impulses.

| Area | Previous envelope | New envelope | Added decks | Added deck surface |
| --- | --- | --- | --- | --- |
| Setor 9 | 2400 × 900 | 2400 × 1620 | 16 | 2315 px |
| Complexo Industrial | 2800 × 900 | 2800 × 1620 | 16 | 2650 px |
| Tower Floor 1 | 3200 × 900 | 3200 × 1620 | 13 | 2220 px |
| Tower Floor 2 | 3800 × 900 | 3800 × 1620 | 13 | 2260 px |
| Tower Floor 3 | 2600 × 900 | 2600 × 1620 | 9 | 1300 px |

These are coordinate envelopes and horizontal deck-surface measurements, not
measured playthrough distance or a claim that the mandatory campaign doubled.
Most added routes are optional. Elevated deck surface roughly doubles across
the world; the existing ground routes are retained, apart from the Setor 9
quarantine bulkhead, which requires the rooftop approach.

- Setor 9: street-to-rooftop ascent, aerial housing circuit, community antenna,
  water tanks, quarantine crossing and reinforced Matrona containment room.
- Factory: maintenance ascent, upper crane circuit, cooling infrastructure,
  furnace and hydraulic machinery variants, reinforced Warden containment room.
- Tower: security archive circuit, upper neural research circuit and final
  service ascent. The three floors, EMP barriers, elevators and final arena
  remain distinct. Barriers extend through the upper world to prevent bypasses.
- Seven new rewards use the existing secret/credit system; four optional lore
  terminals use existing interactions. No currency or ability system was added.

## Rendering and components

`world-design.js` defines the additions and reusable Canvas architecture. Five
regional palettes use cached 256 × 512 pixel modules, with three variants each.
Housing windows, ventilation, hydraulic cylinders, furnace grilles, data panels,
containment tanks, structural columns, platform braces, hook suspension mounts,
crane machinery and corporate signage share a consistent pixel vocabulary.

The original far skyline/parallax remains behind the architecture. Static
modules are cached; visible platforms and architectural columns are culled.
Camera translation is pixel snapped and nearest-neighbor rendering remains on.
Limited steam, machinery movement, scanner strips and data particles add motion.
Rain is restricted to the exposed Setor 9 district. Decoration is behind actors
and boss telegraphs; no foreground layer hides attacks. The central computer
and its existing phase/shutdown reactions remain visible.

## Platforms, hooks, camera and checkpoints

67 additional one-way decks and 16 grapple anchors connect upper circuits.
Braces and suspension hardware explain their physical support. Existing arena
platforms, industrial hazards and enemy placements remain intact.

The camera follows above the old top boundary and clamps to the current region
or tower floor. Existing boss bounds take priority. Five additional ground-level
checkpoints serve the rooftop substation, factory workshop, security archive,
laboratory observation area and final arena approach. Existing checkpoints stay.

## Transitions and elevators

`region-transitions.js` is the interaction/update coordinator for regional doors
and delegates existing tower machinery to `TowerController`. Simultaneous
interactions are blocked. Regional doors run a two-second locking/opening/fade/
reposition/fade-in sequence, validate destination collision, reset movement,
clear projectiles/effects, update region/checkpoint/camera and restore controls.
Failures return the player to the source position.

Both directions are supported. Matrona gates the factory; Warden plus EMP gates
entry to the tower. Legacy tower saves without EMP can return to ?ris. Walking or jumping across these boundaries cannot bypass interaction.
The tower's existing permanent EMP elevator unlocks remain reusable. Elevator
frames, floor displays, mechanical rails and opening/closing doors were improved;
arrivals now set facing and clear old effects/projectiles. EMP is never consumed.

## Saves and preservation

The existing save key and version 1/2 readers remain. `worldDesign` is an optional
additive metadata field on normalized saves. Upper-world coordinates are valid.
Coordinates overlapping new solid geometry move to its top, or beside a barrier
whose top is outside the playable envelope. Migration is tested for repeated
loads. Boss flags, inventories, NPC events, EMP and elevator unlocks survive.
No save deletion, sprite edits, combat controller changes, dialogue replacements
or new mandatory abilities were made for this update.

## Verification

- All 18 non-browser `.mjs` suites passed, covering campaign, 20 legacy save
  cases, combat, dash, player animation, NPCs, all bosses and tower enemies.
- `world-design.mjs` passed at 30/60/120 FPS: every added deck reachable through
  actual jump/grapple physics; Setor 9 checked without double jump. Also checks
  supported rewards, quarantine routing, upper camera and solid-overlap saves.
- Edge browser world run: 84 checks, 13 regional journeys, four elevator journeys,
  EMP rejection, arrival collision, restored movement, retained saves, no duplicate
  enemy IDs and no JavaScript exceptions. All 47 loaded assets ready, zero failed.
- Existing browser Véspera suite: 72 checks; tower enemies: 176 checks; central
  computer: 42 checks, including phase reactions, shutdown and ending.
- The weather assertion in the central computer suite was updated to expect
  rain only in Setor 9, matching the new regional atmosphere.
- Syntax checks and `git diff --check` completed successfully.

## Visual evidence

`tests/world-baseline/` holds ten original captures. `tests/world-updated/` holds
15 captures: streets, rooftops, Matrona, machinery, Warden, all three tower floors,
Véspera/core, gate, antenna, crane, archive, door opening and region title.
The existing central-computer browser suite also captures its six visual states.

The compared views show denser architecture and supported vertical routes rather
than empty skyline space. Core rendering stays behind all three combat actors.

## Remaining limitations

The horizontal spans and arena widths were intentionally preserved. Most expansion
adds optional exploration; it does not double mandatory campaign travel. Automated
physics checks demonstrate reachable decks, but do not substitute for a complete
human playthrough or establish a measured difficulty curve. No desktop performance
benchmark or full real-time keyboard-only campaign playthrough was performed.
