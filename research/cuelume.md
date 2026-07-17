# Cuelume Library Research

## Package Status

| Field | Value |
|-------|-------|
| Version | 0.1.2 (latest) |
| Author | Daniel Belyi (`danielwh2`) |
| License | MIT |
| Created | 2026-07-10 |
| Last published | 2026-07-15 |
| Total versions | 3 (0.1.0, 0.1.1, 0.1.2) |
| Monthly downloads | ~13,500 |
| Runtime dependencies | **0** |
| Dev dependencies | `typescript ^5.6.0` only |
| Repository | https://github.com/Danilaa1/cuelume |
| npm page | https://www.npmjs.com/package/cuelume |
| GitHub stars | 531 |
| GitHub forks | 14 |
| Open issues | 3 |

## Source Code Analysis

The package ships TypeScript source under `src/`, compiled to `dist/` via plain `tsc`. Four source files:

- `src/index.ts` — public re-exports
- `src/sounds/recipes.ts` — the fourteen sound definitions (data, not code)
- `src/audio/engine.ts` — Web Audio synthesis and playback engine
- `src/interactions/bind.ts` — declarative DOM binding

### 14 Sounds — VERIFIED

Counted in `src/sounds/recipes.ts` as keys of the `RECIPES` object:

`chime`, `sparkle`, `droplet`, `bloom`, `whisper`, `tick`, `press`, `release`, `toggle`, `success`, `error`, `page`, `loading`, `ready`

Exact count: **14**. Each is a distinct recipe with its own layer structure (tones, noise, filters, shimmer tails). No duplicate or trivially renamed entries.

### Zero Runtime Dependencies — VERIFIED

`package.json` has only `devDependencies: { typescript }`. The `exports` field ships a single ESM entrypoint. No third-party code in the bundle.

### ESM-Only — VERIFIED

- `"type": "module"` in package.json
- `"exports"` field only maps `"import"` (no `"require"` condition)
- tsconfig: `"module": "ESNext"`, `"moduleResolution": "bundler"`

No CommonJS output. `require("cuelume")` will fail.

### SSR-Safe — VERIFIED

Two independent guards:

1. **`engine.ts` `getAudioContext()`**: checks `typeof window === "undefined"` before constructing an `AudioContext`. Returns `null` on the server, making `play()` a silent no-op.
2. **`bind.ts` `bind()`**: checks `typeof document === "undefined"` and returns immediately on the server.

No browser APIs are accessed at module scope — `AudioContext` is only referenced inside functions.

### Lazy / Shared AudioContext — VERIFIED

`engine.ts`:
```ts
let sharedContext: AudioContext | null = null;
```
- Created once, on first `play()` call via `getAudioContext()`
- Checks for `webkitAudioContext` fallback
- Stored in module-level variable, shared across all subsequent calls
- Never created eagerly at import time

### Pointer-Aware — VERIFIED

`bind.ts` `isMouse()`:
```ts
event.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches
```
- Hover and press/release check this before firing
- Toggle (click) does **not** check — works for keyboard, touch, and mouse, matching the claim

### Hover Repeat Guard — VERIFIED

`bind.ts`:
```ts
const HOVER_GAP_MS = 150;
// ...
if (now - lastHoverTime < HOVER_GAP_MS) return;
```
Global throttle across all hover triggers. The 150ms value matches the docs claim.

### Dynamic Idempotent Binding — VERIFIED

- `boundRoots = new WeakSet<ParentNode>()` — `bind()` checks `if (boundRoots.has(scope)) return;`, preventing double-attach
- Event delegation uses `event.target.closest("[attr]")` — resolves targets at event time, so dynamically added elements are handled without rescanning
- `WeakSet` allows garbage collection of removed DOM trees

### Autoplay-Friendly — VERIFIED

`engine.ts` `play()`:
```ts
if (context.state === "running") {
  renderRecipe(context, recipe);
} else {
  try {
    void context.resume().then(/* ... */, () => {});
  } catch { /* swallow */ }
}
```
Also checks `navigator.userActivation?.hasBeenActive` — won't even attempt playback before first user gesture.

### Safe Fallback — VERIFIED

- `play()` returns early if `!isSoundName(sound)` — invalid names are silently ignored
- `getAudioContext()` returns `null` when Web Audio is unavailable
- All error paths in `resume()` are swallowed (empty catch, empty rejection handler)

### Exported API — VERIFIED

`src/index.ts`:
```ts
export type { SoundName } from "./sounds/recipes.js";
export { sounds } from "./sounds/recipes.js";
export { play, setEnabled } from "./audio/engine.js";
export { bind } from "./interactions/bind.js";
```

Exactly matches the documented API: `play`, `bind`, `setEnabled`, `sounds`, `SoundName`.

## Claim Verification

| Claim | Status | Evidence |
|-------|--------|----------|
| 14 sounds | **Verified** | 14 keys in `RECIPES` object — `recipes.ts` |
| Zero runtime dependencies | **Verified** | `package.json` has 0 dependencies, only `typescript` as devDep |
| SSR-safe | **Verified** | `typeof window === "undefined"` guard in `engine.ts`, `typeof document === "undefined"` in `bind.ts` |
| Pointer-aware | **Verified** | `isMouse()` checks `pointerType === "mouse"` + `matchMedia` in `bind.ts` |
| Hover repeat guard (150ms) | **Verified** | `HOVER_GAP_MS = 150` global throttle in `bind.ts` |
| One lazy AudioContext | **Verified** | `sharedContext` created on first `play()`, reused thereafter |
| ESM-only | **Verified** | `"type": "module"`, exports only `"import"` condition |
| Dynamic idempotent binding | **Verified** | `WeakSet` guard, `closest()` delegation in `bind.ts` |
| Autoplay-friendly | **Verified** | `context.resume()` with silent error handling |
| Safe fallback | **Verified** | `isSoundName()` guard, null context check, empty catch blocks |
| `play(name?)` defaults to `"chime"` | **Verified** | Default param in `engine.ts` |
| `bind(root?)` defaults to document | **Verified** | `root ?? document` in `bind.ts` |
| `setEnabled(boolean)` | **Verified** | Simple boolean flag in `engine.ts` |
| `sounds` is the name list | **Verified** | `Object.keys(RECIPES)` in `recipes.ts` |
| `SoundName` union type | **Verified** | `keyof typeof RECIPES` in `recipes.ts` |
| No audio files | **Verified** | All sounds synthesized from oscillator + noise layer recipes |
| MIT license | **Verified** | LICENSE file on GitHub, `license: "MIT"` in package.json |

## Bundle Impact

| Metric | Value |
|--------|-------|
| Raw size | 7,175 bytes (~7.0 KB) |
| Gzipped | 2,281 bytes (~2.2 KB) |
| Unpacked (installed) | 39,699 bytes |
| Dependency count | 0 |

Source: [bundlephobia.com/api/size?package=cuelume@0.1.2](https://bundlephobia.com/api/size?package=cuelume@0.1.2) + npm registry metadata.

The `approximateSize` field on bundlephobia reports 14,658 bytes for the full unpacked source including TypeScript declarations. The minified JS output (what a bundler ships) is ~7 KB / ~2.3 KB gzipped.

## Assessment

**Everything checks out.** The `cuelume.md` file in the repo is essentially the package's README, and every claim has been verified against the actual source code:

- All 14 sounds are real, distinct recipes (not volume tweaks on the same oscillator)
- Zero dependencies confirmed at package.json level
- All browser-safety guards (SSR, autoplay, fallback) are present in the source
- The API surface matches exactly what's documented
- Bundle impact is minimal (~2.3 KB gzipped, zero deps)
- ESM-only with no CJS escape hatch

The library is at v0.1.2 (1 week old) with 531 GitHub stars and ~13.5K monthly downloads, suggesting early traction. No red flags found — the documentation is accurate and the implementation is clean.

One minor note: the npm page returned a 403 when fetched directly (likely bot protection), but the registry API at `registry.npmjs.org` returned full metadata. The GitHub repo at `github.com/Danilaa1/cuelume` is public and accessible.

---

*Researched 2026-07-17. Sources: npm registry API, GitHub raw content, bundlephobia API.*
