# V-3 Sentinel Drone integration

Implemented in the existing Industrial Complex drone slot. No additional spawn or global drone replacement was introduced.

## Artwork and configuration

- Original: `drone.png` in the project root, **252 × 134 pixels**, transparent PNG.
- Gameplay copy: `assets/enemies/v3_drone/idle.png`.
- Both files have SHA-256 `A094289451961B48AB55A568488279E20BD61F3DCD882FD014BE09EDCA93631D`; the original colors, transparency and artwork are unchanged.
- Asset ID: `v3_drone`; display name: `Drone Sentinela V-3`; manifest region: `industrial`.
- Configuration: `assets/enemies/v3_drone/config.json`.
- Single animation: `idle`, frameWidth **252**, frameHeight **134**, columns **1**, count **1**, fps **1**, loop **true**.
- Uniform render scale: **0.25**, producing approximately **63 × 34** pixels.
- Origin: **(126, 67)**, drawn at the body's physical center.
- Native/default facing: **−1**. The existing renderer mirrors the complete sprite using nearest-neighbor sampling. No rotation, stretching, fabricated frames or attack sheets were added.
- Body/hurtbox: **60 × 28**, collision offsets **(0, 0)**.

## Spawn and movement

- Existing ID: `1-1480-drone`; existing type remains `drone`.
- Spawn/home top-left: **(4290, 660)**. Horizontal placement remains unchanged; Y was elevated from the old ground-level position to make this a flying encounter.
- Health **30**, damage **8 per projectile**, matching the original drone slot's normal-enemy balance.
- Flight envelope: left **4260**, right **4420**, top **630**, bottom **710**. The entire body remains inside these limits: X **4260–4360**, Y **630–682**.
- This pocket sits above the industrial floor and below the overhead catwalk, before Warden's arena at X **4490**. No platform, hazard, grapple anchor or arena geometry changed.
- Patrol speed **40 px/s**; combat reposition speed **52 px/s**, with exponential acceleration/deceleration. Gentle vertical hover amplitude **4 px**; vertical tracking is capped at **35 px/s**.
- Detection: horizontal distance below **420 px**, vertical center separation below **260 px**. During combat it seeks a controlled 95–155 px horizontal gap, constrained by the encounter pocket, and adjusts altitude within reach of Kael.
- Flight uses physical body coordinates, checks platform collisions, and clamps both map/region and encounter boundaries. Normal jump melee reach was verified with actual player physics. Existing double jump and grapple movement remain available without modification.

## Suppression Burst

Dedicated module: `js/v3-drone.js`.

State cycle: `patrol/reposition → warning → burst → recovery → patrol/reposition`, with separate death and stun/cancellation handling.

| Setting | Value |
| --- | --- |
| Warning | **0.45 s** |
| Shots | **3** |
| Shot spacing | **0.16 s** |
| Projectile speed | **230 px/s** |
| Projectile lifetime | **2.4 s** |
| Cooldown | **2.5 s**, measured from warning start |
| Recovery after third shot | **0.8 s** |
| Visible projectile/collision rectangle | **6 × 6 px** |

At warning start, the drone faces Kael and marks his current center. Sensor flashes, an underbody weapon charge and `! RAJADA` announce the attack. The marked target remains fixed for the three shots; Kael can jump, dash or move away. The drone slows during targeting/firing and pauses to recalibrate afterward. Recoil changes the physical horizontal velocity slightly, so the sprite, body and muzzle stay aligned.

Muzzle: physical body center + **17 × facing** horizontally and **14.5** vertically, matching the original underbody gun. Sensor: body center + **12 × facing** horizontally and **2.5** vertically. Thruster effects mirror with the supplied artwork.

Projectiles and all firing effects are Canvas primitives. A swept segment against expanded rectangles selects the first collision with Kael or platform geometry, including thin platforms. Projectiles are removed on contact, including when Kael is invulnerable, so a single projectile cannot hit repeatedly. Solid cover also prevents initial targeting through walls. There is no contact attack, second weapon or invisible blast damage.

Simulation uses steps of at most **1/120 s** to keep movement and shot deadlines consistent across slow frames. Rendering and F3 never advance attack timers or create projectiles.

## Feedback and lifecycle

- Idle: physical hovering and small propulsion rectangles beneath both thrusters.
- Targeting: central sensor flash, visible weapon charge and warning label.
- Firing: small red/cream muzzle flash and physical recoil.
- Hurt: pixel sparks; existing melee and EMP damage apply normally.
- Death: short **0.75 s** mechanical fragment explosion, no fabricated death image.
- Death/distance cleanup, player respawn and existing boss-encounter cleanup clear pending targeting, aim, shots, recoil/movement and projectile arrays.
- Enemy respawn restores **(4290, 660)**, health 30 and a clean airborne patrol. Existing melee rewards/30-second respawn and EMP's 8-second respawn policy remain intact.
- F3 adds the V3 body/hurtbox, actual projectile rectangles, muzzle marker, state, shot count and cooldown.

## Files created or modified for this integration

Created:

- `assets/enemies/v3_drone/idle.png`
- `assets/enemies/v3_drone/config.json`
- `js/v3-drone.js`
- `tests/v3.html`
- `tests/v3-browser.js`
- `tests/run-v3-browser.py`
- `tests/v3-browser-results.json`
- `tests/v3-preview.png`
- `docs/v3-integration.md`

Modified:

- `js/config/assets.js`: V3 regional registration.
- `js/enemies.js`: industrial-slot configuration and V3 update/render/lifecycle dispatch.
- `js/engine.js`: V3 config loading and reset hooks in existing cleanup paths.
- `js/combat-debug.js`: V3 overlays.
- `tests/m4-cases.js`: the assertion about the industrial drone now expects its dedicated V3 behavior; all M4 cases remain intact.
- `tests/factory.mjs`: the projectile fixture now supplies the visible V3 bullet dimensions and vertical velocity.
- `tests/e7-browser-results.json` and `tests/e7-preview.png`: refreshed by the regression run.

The V3 integration does not change E7/M4/Warden modules or assets, Kael combat, global damage rules, generic drone behavior in other regions, world geometry, physics or the shared renderer.

## Verification

**PASS: 1,844 V3/regression checks**, using actual Chrome headless and encounter simulation at **30/60/120 FPS**. **PASS: 939 E7/regression checks** after V3 integration. These are assertion counts including per-frame movement checks, not counts of distinct test scenarios.

Validated:

- Original dimensions, byte-identical copy and 12,652 fully transparent pixels.
- Successful asset loading/validation, quarter scale, both mirrored appearances and applied collision configuration.
- Original slot/placement, smooth flight, both patrol endpoints, hover, boundaries and platform separation.
- Underbody muzzle, warning duration, exactly three shots per completed burst, shot spacing, recovery and cooldown.
- Swept collision, thin cover, line-of-sight blocking, single-hit consumption, invulnerability and lifetime expiry.
- Actual `updatePlayer` jump, dash and reposition inputs evade the marked burst.
- Actual normal-jump physics and melee hitbox reach the drone.
- Melee/EMP death, attack cancellation, cleanup and airborne respawn.
- A synthetic drone in another region retains the existing legacy projectile behavior.
- Existing M4, Kael combat, dash, Warden, Warden arena and Industrial Complex suites pass. The E7 browser suite passes separately.
- Redraw/F3 do not advance targeting or fire.
- `git diff --check` passes.

Node is unavailable locally; the existing Warden/factory Node suites were executed in Chrome with the previously established browser assertion/file-reading adapter. `npm test` was not run. The saved V3 atlas and gameplay/F3 screenshot were visually inspected; subjective combat feel still benefits from a manual playthrough.

To reproduce: serve the project at `http://127.0.0.1:8765`, then run `tests/run-v3-browser.py` and `tests/run-e7-browser.py` with the installed Python interpreter. Both runners use Chrome and Python's standard library.
