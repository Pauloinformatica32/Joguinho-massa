# Nova Aurora: mobile browser implementation

The game retains its Canvas engine, 960×540 world view, campaign, approved sprites,
portraits and educational content. No campaign save was deleted or reset. Automated
browser tests use disposable Chrome profiles and localhost developer fixtures.

## Architecture and controls

- `js/input.js`: ActionInput now accepts semantic actions identified by independent
  source IDs. A pointer never dispatches a synthetic keyboard event. Touch and
  keyboard sources coexist; releasing one source cannot release another.
- `js/mobile-controls.js`: optional dynamically imported Pointer Events adapter.
  Each pointer is captured and tracked, including multiple pointers on one button.
  Release, cancellation, lost capture and leaving a button release that source.
  Blur, visibility, orientation, resize, fullscreen and overlays clear held touch
  actions and pending presses. Overlay visibility and engine pause/death state
  block controls. Canvas touches do not become mouse attacks.
- Automatic detection uses both pointer media queries and `maxTouchPoints`, keeping
  controls available on hybrid touchscreen computers.
- Settings offer automatic / always / hidden. The preference uses
  `nova-aurora-touch-v1`, independent of campaign saves. Mobile layout remains
  responsive even when the player hides the buttons. Keyboard rebinding remains.
- Left: left, down, right. Right: special, dash, interact, attack, jump. A smaller
  top-right strip provides pause, fullscreen, cycle implant and activate implant.
  Buttons use 44–58 CSS pixel targets, translucent dark fills, cyan/magenta borders
  and pressed feedback. Insets respect device safe areas.
- DOWN + JUMP drops through the supporting `oneWay` platform. The drop suppresses
  normal/double jump, skips only that platform elevation and preserves landing on
  lower platforms. Solid floors still jump normally. Desktop uses the same rule.

## Viewport, interfaces and fullscreen

`css/mobile.css` letterboxes a proportionally scaled 16:9 Canvas without changing
world coordinates. Pixelated rendering and disabled Canvas smoothing remain.
Dynamic viewport units have a `vh` fallback. Portrait shows “Para uma experiência
melhor, vire o celular na horizontal.” and a continue button; rotating preserves
the engine and campaign. The orientation prompt suspends simulation until dismissed.

HUD health, energy, implant, objective and boss health remain visible above the
bottom controls. Credits and keyboard shortcut prose are omitted from the compact
HUD; detailed status remains available in the pause panels. Menus and dialogue
cards scroll vertically, with safe-area-aware height limits and larger targets.
Quizzes retain all four alternatives, wrapping, Yara help, portrait and hint panel.
Scrolling and pinch zoom remain available inside interfaces; gameplay surfaces
disable browser touch gestures. No portraits or dialogue text were edited.

The existing optional FullscreenController now also handles WebKit-prefixed APIs.
Fullscreen is requested following a real button release; it is never automatic.
Input clears on transitions, while Canvas aspect ratio and overlays are retained.
Unsupported or refused requests display a message and keep windowed play available.

Both touch and display modules use caught dynamic imports. Blocking both modules
was tested: New Game and Continue still initialize. The main entry no longer uses
top-level await for its localhost-only developer session.

The question bank previously used JSON import attributes. It now uses a standard JS
module generated from the original JSON, avoiding that syntax as a boot dependency.
An equality assertion verifies every question, answer, hint and reward is identical.
Regenerate after editing the canonical JSON with:

```text
python tools/sync-network-question-bank.py
```

## Performance

- Simulation advances at fixed 1/60-second steps from requestAnimationFrame, with
  bounded catch-up after stalls. Hidden pages do not accumulate simulation time.
- Mobile rendering reduces decorative rain from 120 to 40 streaks and removes
  selected decorative Canvas shadow blurs. AI, damage and attack timing are intact.
- Most HUD DOM updates are limited to 20 Hz; implant state stays immediately updated.
- Overlay observation excludes the HUD. Touch DOM state changes only when visibility
  or fullscreen state changes, rather than rebuilding controls each frame.
- No libraries, engines, external fonts or network dependencies were added.

## Validation

`tests/run-mobile-browser.py` uses real Chrome DevTools touch injection and actual
Pointer Events, a local HTTP server and a fresh isolated browser profile. It checks:

- 360×800 and 390×844 portrait; 640×360, 844×390 and 915×412 landscape.
- Touch New Game; held left/right; jump/double jump; simultaneous movement with
  attack, jump, dash and grapple; down+jump; independent finger release; cancellation;
  leaving a button; blur; orientation resize; pause/resume.
- Yara interaction and portrait, touch hint request and answer selection, all 12
  challenges via the existing educational regression suite, rewards and hint safety.
- Touch implant selection/activation, existing inventory suite, save/continue,
  death animation and touch checkpoint restart, persisted control preference.
- Canvas proportions, no horizontal page overflow, visible ≥44px touch targets,
  scrolling long dialogue and wrapped quiz answers at every requested size.
- Tower movement/jump, Véspera movement/dash with boss HUD and overload telegraphs,
  Industrial Complex movement/attack, and desktop keyboard movement.
- New Game and Continue with both optional feature modules blocked; no uncaught
  browser exceptions.

`tests/run-mobile-unit.py` runs 16 suites: input settings, mobile input, animation,
dash, combat, death, factory, tower, network terminals, cybernetics, implant equipment,
Yara hints, level traversal/design, Matrona, Warden and Véspera. Relevant gameplay
tests cover 30/60/120 FPS. The new mobile suite also verifies source coexistence,
remapping and drop-through/solid-floor collisions. Results are saved in
`tests/mobile-unit-results.json` and `tests/mobile-browser-results.json`.

`tests/check-mobile-paths.py` audits exact-case local module, stylesheet and markup
references and inventories existing missing optional/prototype asset references.
These predate the mobile changes; no replacement sprites were introduced.
`git diff --check` is part of final verification.

## Limits and remaining validation

- Chrome on Windows with mobile viewport/touch emulation was available. This is
  Blink-based mobile behavior coverage, not a physical Android device test.
- No iPhone, Safari/WebKit runtime or physical Android device was available.
  Safari compatibility was reviewed in code, including Pointer Events, viewport
  fallback, safe areas, optional WebKit fullscreen and portable question imports.
  Actual Safari behavior, browser chrome, thermal load and hardware performance
  still require device testing.
- Headless Chrome refused fullscreen with `TypeError: not granted` even with active
  user activation. The refusal/message path passed. Actual fullscreen entry/exit
  and safe-area behavior require testing in a supported interactive device browser.
- Regional and boss tests use controlled placements; they are not a complete
  campaign playthrough on a phone.
- GitHub Pages was not deployed or tested. Relative import/path checks and local
  HTTP startup tests passed; that does not certify the published build.
- No commit, push or publication was performed.

## Files

Runtime files modified: `index.html`, `js/input.js`, `js/main.js`, `js/player.js`,
`js/physics.js`, `js/settings-ui.js`, `js/display-mode.js`, `js/ui.js`, `js/world.js`,
`js/network-terminals.js`.

Runtime files added: `css/mobile.css`, `js/mobile-controls.js`,
`js/network-question-bank.js`.

Supporting files added: this report, `tools/sync-network-question-bank.py`,
`tests/mobile-input.mjs`, `tests/run-mobile-browser.py`, `tests/run-mobile-unit.py`,
`tests/check-mobile-paths.py`, JSON result reports including the path audit,
five viewport screenshots and a Véspera mobile screenshot.
