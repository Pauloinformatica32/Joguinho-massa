# E-7 Containment Shield integration

The existing Industrial Complex `executor` is now **Escudeiro de Contenção E-7**, asset ID `e7_shield`, region `industrial`. Its ID remains `1-1150-executor`, spawn/home X remains **3770**, and feet remain at ground Y **790**. No duplicate enemy was added. Health **90**, damage **22**, movement speed **38** retain the slot's existing balance.

## Selected original artwork

The entire project was searched, including hidden/ignored paths. Dimensions and alpha bounds were measured with System.Drawing, and every E7 PNG was visually inspected.

| Original location | Original dimensions | Selected role |
| --- | --- | --- |
| `E7/idle.png` | 160 × 150 | Idle, one frame |
| `E7/pixel-art-walk (1).png` | 1280 × 160 | Walk, eight 160 × 160 frames |
| `E7/idle_to_guard.png` | 960 × 150 | Defensive transition, six 160 × 150 frames |
| `E7/defesa.png` | 160 × 150 | Guard pose, one frame, exported at twice the transition pose's size |

`E7/pixel-art-custom (1).png` (480 × 80, six frames) was rejected: it contains an armed experimental variant. It is never registered or loaded. All original E7 files remain untouched.

Final directory: **`assets/enemies/e7_shield/`**. Its four PNGs are `idle.png`, `walk.png`, `guard.png`, and `idle_to_guard.png`.

`tools/prepare-e7.ps1` reproduces the copies. Idle is copied verbatim. Walk frames are aligned to exclusive bottom Y 122 and transition frames to bottom Y 116, correcting one-pixel export jitter without rescaling. Guard is uniformly reduced from 160 × 150 to 80 × 75 using nearest-neighbor sampling, then placed at (39, 41) in a transparent 160 × 150 canvas. This matches the transition's crouched protective posture. Nothing is stretched; the original anatomy and shield are preserved.

## Exact configuration

`assets/enemies/e7_shield/config.json` uses the existing AssetManager/SpriteRenderer format:

- Scale: **0.85**, native facing: **-1**, default facing: **-1**.
- Origin: **(80, 116)**; walk overrides it with **(80, 122)**.
- Body collision: **34 × 64**, offsets **(0, 0)**.
- PNG transparency and nearest-neighbor rendering use the existing renderer unchanged.

| Animation | Final sheet dimensions | Frame dimensions | Columns/count | FPS | Loop |
| --- | --- | --- | --- | --- | --- |
| idle | 160 × 150 | 160 × 150 | 1 / 1 | 1 | true |
| walk | 1280 × 160 | 160 × 160 | 8 / 8 | 9 | true |
| idle_to_guard | 960 × 150 | 160 × 150 | 6 / 6 | 10 | false, freezeLast true |
| guard | 160 × 150 | 160 × 150 | 1 / 1 | 1 | true |

Combat config values: `detect: 340`, `range: 78`, `guard: 0.65`, `transition: 0.6`, `windup: 0.4`, `active: 0.2`, `vulnerable: 0.8`, `recovery: 0.5`, `bashSpeed: 170`. Distances/speeds are world pixels and pixels/second; timings are seconds. Engine asset loading assigns this object to the E7 instance; the dedicated module supplies matching defaults.

## State machine and attack

`js/e7-shield.js` owns simulation, damage gating, shield geometry, rendering and reset/shutdown functions. The ordinary combat cycle is:

`patrol → approach → guard_transition → guard → attack_windup → shield_bash → vulnerable → return_to_guard → guard`

Idle/death are handled separately. Hurt feedback occurs **inside vulnerable**, preserving its timer rather than interrupting it with a new defensive state. Guard transition lasts 0.6 seconds, displays all six frames once, then switches to the held guard pose. Simulation selects frames, so pause/redraw cannot restart a transition or create attack damage.

The sole offensive move is hydraulic shield bash. Facing locks at windup, the shield receives a red outline and warning, and the pose leans slightly around its grounded feet. During the 0.2-second active state, the body advances through `moveBody` at 170 pixels/second (roughly 34 pixels, subject to collision/timestep). There are no projectiles or secondary attacks.

The shield/active attack rectangle is **12 × 50**:

- Facing right: X = body center + 22.
- Facing left: X = body center − 34.
- Y = feet − 56.

These coordinates fit inside the normalized guard's visible shield. The bash and sprite share the same body position. The active rectangle exists only during `shield_bash`; solid cover blocks hits. A per-bash latch permits at most one contact, including when the player is invulnerable. Jumping above it, dashing with existing invulnerability, or leaving its range evades the strike.

Patrol bounds are **3720–3860**, keeping this short encounter between the coolant pool and existing solid cover. Movement respects the existing physics, platform edges, region bounds and hazards. No map geometry or spawn relocation was necessary.

## Defense, vulnerability, death

`e7CanTakeDamage` requires a living E7 in `vulnerable` with a positive vulnerability timer. Every existing player damage route checks this same gate: melee (`playerDamage`), generic/ranged-style damage (`hurt`), and the actual EMP path (`Engine.useImplant`). These branches apply only to asset ID `e7_shield`; ordinary enemy damage rules remain unchanged. Rear attacks do not bypass the gate. Melee contacting only the visible shield also produces a block.

Blocked hits preserve health and show a brief shield flash, pixel sparks and `BLOQUEADO`; Web Audio synthesizes a short metallic clang after user activation. Full guard begins only after the six-frame transition, while other closed states also reject damage to enforce the vulnerability-only rule.

After the bash, **0.8 seconds** of vulnerability uses the existing upright, lowered-shield idle pose, a slight forward lean, exposed chest light, small mechanical steam pixels and `PRESSÃO BAIXA`. Damage applies normally and shows a hit reaction without cancelling the opening. Returning to guard plays the transition again, with recovery/cooldown and a guard dwell before the next windup.

There are no real `attack.png`, `vulnerable.png` or death sheets. None were invented. Attack uses the guard pose and physical body impulse; vulnerability uses idle; death uses a 0.75-second mechanical fade/fragments.

Death immediately disables offense and defense, clears movement, state timers and temporary feedback. Existing melee rewards/30-second respawn and EMP's existing 8-second respawn policy are preserved. Enemy respawn, player respawn, distance cleanup and existing boss encounter cleanup reset E7-specific state. Respawn cannot leave an attack hitbox or stale vulnerability active.

F3 shows body/hurtbox, yellow shield area, red active bash rectangle, current state, vulnerability timer and attack cooldown. Debug drawing does not mutate simulation.

## Files changed

Created:

- `js/e7-shield.js`
- `assets/enemies/e7_shield/{idle.png,walk.png,guard.png,idle_to_guard.png,config.json}`
- `tools/prepare-e7.ps1`
- `tests/e7.html`, `tests/e7-browser.js`, `tests/e7-regressions.js`, `tests/run-e7-browser.py`
- `tests/e7-browser-results.json`, `tests/e7-preview.png`
- `docs/e7-integration.md`

Modified:

- `js/enemies.js`: existing executor registration, dedicated update/render and lifecycle dispatch.
- `js/config/assets.js`: the regional E7 manifest entry.
- `js/combat.js`: E7-only melee/generic damage routing and shield interception.
- `js/engine.js`: E7 configuration, EMP damage routing and cleanup/reset hooks.
- `js/combat-debug.js`: E7 overlays.
- `tests/factory.mjs`: executor expectations now follow E7 timing; projectile checks use the existing drone.
- `tests/m4-cases.js`: the unrelated-enemy regression now checks the unchanged drone instead of requiring the removed executor attack. M4's own test scenarios were retained.

M4 and Warden gameplay/artwork, Kael's player module, physics, world/map, SpriteRenderer and AnimationManager were not modified. Pre-existing deleted root images `dra._Iris.png` and `téo.png` were left as found.

## Verification

**PASS: 939 checks** in actual Chrome headless, including encounter simulation at **30/60/120 FPS**. See `tests/e7-browser-results.json` and the atlas/gameplay/debug screenshot `tests/e7-preview.png`.

Covered: successful asset loading with no failed images or invalid grids; all eight walking frames; all six non-looping transition frames; transparency, scale and foot alignment; held guard; both facing directions; shield-only/rear/generic/EMP blocking; feedback; windup and bash duration; single-hit latch; jump/dash/retreat evasion; full vulnerability and normal melee/ranged/EMP damage; preserved vulnerability after hits; recovery; death cleanup; respawn; safe patrol bounds; normal damage to another enemy; and the existing M4, Kael combat and dash suites.

The existing `tests/warden.mjs`, `tests/warden-arena.mjs` and updated `tests/factory.mjs` also passed in Chrome. Node is unavailable on this machine, so `tests/e7-regressions.js` executes these original suites using browser equivalents for their Node assertion/file-reading imports, including actual PNG header reads. `npm test` was not run. `git diff --check` passed.

The saved atlas was visually inspected for coherent artwork, grounded poses, one shield/two-arm anatomy and mirrored positioning. Audio playback and subjective encounter timing still need a manual playthrough; automated/headless checks cannot confirm sound output or player feel.

To reproduce: serve the project at `http://127.0.0.1:8765`, then run `tests/run-e7-browser.py` with the available Python interpreter. The runner uses the installed Chrome and only Python's standard library.
