# boneyard-js Research

> Primary sources: npm package page, GitHub repo (0xGF/boneyard), official docs (boneyard.vercel.app), source code at `packages/boneyard/src/`

---

## 1. Latest Version and Install

**Latest version:** `1.9.0` (published Jul 7, 2026)
**License:** MIT
**Dependency:** playwright (used by CLI/Vite plugin)

```bash
npm install boneyard-js
# or
pnpm add boneyard-js
# or
yarn add boneyard-js
```

Playwright is a runtime dependency (not devDep). On first CLI run, chromium auto-installs. Manual install:
```bash
npx playwright install chromium
```

> Sources: [npm page](https://www.npmjs.com/package/boneyard-js), [GitHub package.json](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/package.json)

---

## 2. React Router 7 / React 19 Compatibility

**No known issues specific to boneyard + React 19/RR7.**

- Peer dependency is `react: >=18` (all optional). React 19 satisfies this.
- DevDependencies in the repo include `@types/react: ^19.0.0` and `react: ^19.0.0` — it's developed and tested against React 19.
- The React component (`react.tsx`) uses only standard hooks: `useState`, `useEffect`, `useLayoutEffect`, `useRef`, `Suspense`. No deprecated APIs.
- The generated `registry.js` includes `"use client"` directive for React projects (important for Next.js RSC, harmless elsewhere).
- No React Router-specific hooks are used. boneyard is router-agnostic.
- The CLI has filesystem route scanning for Remix/React Router v7 in `app/routes/**/*.{tsx,jsx,ts,js}` — it understands flat routes and layout conventions.

**Potential SSR gotcha:** React Router 7 with SSR renders `<Skeleton>` on the server where `window` is undefined. The component handles this:
- `ResizeObserver` only runs in `useEffect` (client-only).
- `mounted` state starts `false`, prevents hydration mismatch on initial width.
- Pre-generated bones from the registry render correctly during SSR since they're static JSON.

> Sources: [package.json peerDependencies](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/package.json), [react.tsx source](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/react.tsx), [cli.js route scanning](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/bin/cli.js)

---

## 3. Vite Plugin vs CLI Build

**Both work. Vite plugin is recommended for Vite+React setups.**

### Vite Plugin (`boneyard-js/vite`)
- Runs inline with the dev server — no second terminal needed.
- Auto-captures on server start, re-captures on every HMR update (1.5s debounce).
- Supports auth (cookies/headers via `boneyard.config.json`), custom routes, breakpoints, and `--cdp` for existing Chrome sessions.
- Config options:

```ts
// vite.config.ts
import { boneyardPlugin } from 'boneyard-js/vite'

export default defineConfig({
  plugins: [boneyardPlugin({
    out: './src/bones',
    breakpoints: [375, 768, 1280],
    wait: 800,
    framework: 'react',     // auto-detected if omitted
    routes: ['/'],           // which routes to visit
    skipInitial: false,
    cdp: 9222,               // connect to existing Chrome
    debug: false,
  })]
})
```

### CLI (`npx boneyard-js build`)
- Works with any framework, not just Vite.
- Supports `--watch` mode for HMR-like recapture.
- Crawls links + scans filesystem routes automatically.
- Same auth/cookie/cdp support via flags and config.

### Key difference
The Vite plugin only runs in `apply: 'serve'` (dev mode). For production bones, both the CLI and Vite plugin produce identical output.

> Sources: [vite.ts source](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/vite.ts), [cli.js source](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/bin/cli.js), [boneyard.vercel.app/install](https://boneyard.vercel.app/install)

---

## 4. Actual API Surface

### `<Skeleton>` Component Props

Source: `react.tsx` `SkeletonProps` interface + [official features page](https://boneyard.vercel.app/features)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loading` | `boolean` | — | Show skeleton (true) or children (false) |
| `name` | `string` | — | Unique name, generates `name.bones.json` |
| `children` | `ReactNode` | — | Real content, shown when `!loading` |
| `initialBones` | `SkeletonResult \| ResponsiveBones` | — | Pre-generated bones (overrides registry) |
| `color` | `string` | `'#f0f0f0'` | Bone fill color (light mode) |
| `darkColor` | `string` | `'#222222'` | Bone fill color (dark mode) |
| `animate` | `'pulse' \| 'shimmer' \| 'solid' \| boolean` | `'pulse'` | Animation style |
| `stagger` | `number \| boolean` | `false` | Delay between bones in ms (true = 80) |
| `transition` | `number \| boolean` | `false` | Fade-out duration in ms (true = 300) |
| `boneClass` | `string` | — | CSS class on each bone element |
| `className` | `string` | — | Extra class on the wrapper div |
| `fallback` | `ReactNode` | — | Shown when loading but no bones available |
| `fixture` | `ReactNode` | — | Mock content rendered ONLY during `npx boneyard-js build` |
| `snapshotConfig` | `SnapshotConfig` | — | Controls bone extraction behavior |
| `select` | `'container' \| 'viewport'` | `'container'` | Which width picks the breakpoint |

### `<BoneSuspense>` Props

Extends `SkeletonProps` (minus `loading`). Wraps `<Suspense>` + `<Skeleton>`:

```tsx
import { BoneSuspense } from 'boneyard-js/react'

<BoneSuspense name="user-card">
  <UserCard />  {/* uses useSuspenseQuery — suspends automatically */}
</BoneSuspense>
```

At build time, wraps children in `<Suspense fallback={fixture ?? null}>` so queries can resolve during the `--wait` window.

### `configureBoneyard()` — Global Defaults

```ts
import { configureBoneyard } from 'boneyard-js/react'

configureBoneyard({
  color: '#e5e5e5',
  darkColor: '#2a2a2a',
  animate: 'shimmer',
  shimmerColor: '#f7f7f7',
  darkShimmerColor: '#2c2c2c',
  speed: '2s',
  shimmerAngle: 110,
  stagger: 80,
  transition: 300,
  boneClass: 'my-bone',
  select: 'viewport',
})
```

### `registerBones()` — Registry

```ts
import { registerBones } from 'boneyard-js'

registerBones({
  "blog-card": { breakpoints: { 375: {...}, 768: {...}, 1280: {...} } },
  "sidebar": { name: 'sidebar', viewportWidth: 320, width: 320, height: 400, bones: [...] },
})
```

### `registry.js` Generation

The CLI/plugin generates a file like:
```js
"use client"
// Auto-generated by `npx boneyard-js build` — do not edit
import { registerBones } from 'boneyard-js'
import _blog_card from './blog-card.bones.json'
import _sidebar from './sidebar.bones.json'

registerBones({
  "blog-card": _blog_card,
  "sidebar": _sidebar,
})
```

If `boneyard.config.json` has runtime config keys (`color`, `animate`, etc.), the registry also emits:
```ts
import { configureBoneyard } from 'boneyard-js/react'
configureBoneyard({"color":"#e5e5e5","animate":"shimmer"})
```

### Config File Format (`boneyard.config.json`)

```json
{
  "breakpoints": [375, 768, 1280],
  "out": "./src/bones",
  "wait": 800,
  "routes": ["/dashboard", "/settings"],
  "color": "#e5e5e5",
  "darkColor": "#2a2a2a",
  "animate": "shimmer",
  "shimmerColor": "#ebebeb",
  "darkShimmerColor": "#333333",
  "speed": "2s",
  "shimmerAngle": 110,
  "stagger": 80,
  "transition": 300,
  "boneClass": "skeleton-bone",
  "select": "viewport",
  "resolveEnvVars": true,
  "auth": {
    "cookies": [{ "name": "session", "value": "env[SESSION_TOKEN]" }],
    "headers": { "Authorization": "Bearer env[API_TOKEN]" }
  },
  "skeletons": {
    "my-skeleton": {
      "route": "/dashboard",
      "wait": 2000
    }
  }
}
```

> Sources: [react.tsx](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/react.tsx), [shared.ts](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/shared.ts), [boneyard.vercel.app/features](https://boneyard.vercel.app/features), [boneyard.vercel.app/install](https://boneyard.vercel.app/install)

---

## 5. Dark Mode Detection

The component uses a **two-layer detection strategy** (from `react.tsx`):

```tsx
useEffect(() => {
  if (typeof window === 'undefined') return
  const checkDark = () => {
    const hasDarkClass = document.documentElement.classList.contains('dark') ||
      !!containerRef.current?.closest('.dark')
    setIsDark(hasDarkClass)
  }
  checkDark()
  // MutationObserver catches .dark toggling on <html>
  const mo = new MutationObserver(checkDark)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  // matchMedia catches OS theme changes that may toggle .dark on non-<html> ancestors
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', checkDark)
  return () => {
    mo.disconnect()
    mq.removeEventListener('change', checkDark)
  }
}, [])
```

**How it works:**
1. Checks if `<html>` has class `dark` — covers Tailwind `darkMode: 'class'`.
2. Checks `containerRef.current.closest('.dark')` — covers nested dark mode wrappers.
3. `MutationObserver` on `<html>` attributes — catches runtime toggles (e.g., theme switcher).
4. `matchMedia('(prefers-color-scheme: dark')` — listens for OS-level theme changes that may toggle `.dark` on parent elements.

**The `.dark` class convention is required.** `prefers-color-scheme` alone does NOT trigger dark bones — the component only reads the CSS class, not the media query result directly. The `matchMedia` listener is a backup to re-check the `.dark` class when the OS theme changes (in case your app toggles `.dark` based on OS preference).

**Color selection:**
- Light mode: `color` prop > `globalConfig.color` > `'#f0f0f0'`
- Dark mode: `darkColor` prop > `globalConfig.darkColor` > `'#222222'`

> Source: [react.tsx source](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/react.tsx) (lines ~131-148)

---

## 6. Responsive Breakpoints at Runtime

### ResizeObserver-based container measurement

```tsx
useEffect(() => {
  const el = containerRef.current
  if (!el) return
  const ro = new ResizeObserver(entries => {
    const rect = entries[0]?.contentRect
    setContainerWidth(Math.round(rect?.width ?? 0))
    if (rect && rect.height > 0) setContainerHeight(Math.round(rect.height))
  })
  ro.observe(el)
  // Initial measurement
  const rect = el.getBoundingClientRect()
  setContainerWidth(Math.round(rect.width))
  if (rect.height > 0) setContainerHeight(Math.round(rect.height))
  return () => ro.disconnect()
}, [])
```

### Breakpoint selection algorithm

From `shared.ts`:
```ts
export function resolveResponsive(
  bones: RegisteredBones,
  width: number,
): SkeletonResult | null {
  if (!('breakpoints' in bones)) return bones
  const bps = Object.keys(bones.breakpoints).map(Number).sort((a, b) => a - b)
  if (bps.length === 0) return null
  const match = [...bps].reverse().find(bp => width >= bp) ?? bps[0]
  return bones.breakpoints[match] ?? null
}
```

**Algorithm:** Picks the **largest breakpoint that fits** (container width >= breakpoint). Falls back to smallest breakpoint if container is narrower than all breakpoints.

**Two select modes** (from `select` prop):
- `'container'` (default): Uses `ResizeObserver`-measured container width. Container-query-like behavior.
- `'viewport'`: Uses `window.innerWidth`. Matches how the CLI keys captures. Use when the container is narrower than the viewport (app-shell layouts). Solves [issue #92](https://github.com/0xGF/boneyard/issues/92).

**Mount behavior:**
- Before mount (SSR/hydration): `viewportWidth = 0`, no bones rendered (avoids hydration mismatch).
- After mount: Uses `window.innerWidth` as immediate fallback before `ResizeObserver` fires.

**Height scaling:** The component scales bone `y` positions proportionally if the runtime container height differs from the captured height:
```ts
const scaleY = (effectiveHeight > 0 && capturedHeight > 0) ? effectiveHeight / capturedHeight : 1
```

> Sources: [react.tsx source](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/react.tsx), [shared.ts source](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/shared.ts), [boneyard.vercel.app/responsive](https://boneyard.vercel.app/responsive)

---

## 7. SSR Gotchas with React Router 7

### No issues with bones data itself
Bones are pre-computed static JSON. They render identically on server and client — no DOM measurement needed at runtime.

### Build mode flag
```ts
// shared.ts
export function isBuildMode(): boolean {
  return typeof window !== 'undefined' && (window as any).__BONEYARD_BUILD === true
}
```
The CLI sets `window.__BONEYARD_BUILD = true` via `page.addInitScript()`. During SSR, `window` is undefined so `isBuildMode()` returns `false` — the component renders normally.

### Hydration-safe mounting
```tsx
const [mounted, setMounted] = useState(false)
useLayoutEffect(() => { setMounted(true) }, [])
// Before mount: viewportWidth = 0 → no active bones → no skeleton overlay
// After mount: viewportWidth = window.innerWidth → bones activate
```
This prevents server/client mismatch on initial render. The skeleton appears on first client paint.

### Skeleton data available on first frame
Since bones are imported as JSON (via registry or `initialBones`), they're available immediately during SSR — no async loading, no waiting for hydration.

### CLI captures from running dev server
The CLI uses Playwright to visit your running app. For React Router 7 SSR apps:
- Start dev server (`npm run dev`)
- The CLI visits the server-rendered pages, waits for hydration, then captures bones.
- The `--wait` flag (default 800ms) gives time for SSR + hydration + data loading.

### Known limitations
- The `MutationObserver` and `ResizeObserver` only run client-side — no server-side dark mode detection or responsive switching.
- `fixture` prop renders during CLI build (via `__BONEYARD_BUILD` flag), but during SSR the real children are rendered. This is correct behavior.

> Sources: [boneyard.vercel.app/ssr](https://boneyard.vercel.app/ssr), [shared.ts source](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/shared.ts), [react.tsx source](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/react.tsx)

---

## 8. Bone Format Spec

### Compact bone format (what `.bones.json` contains)

```ts
// From types.ts
export type CompactBone = [number, number, number, number, number | string]
  | [number, number, number, number, number | string, boolean]
```

**`[x, y, w, h, r, c?]`** where:

| Index | Name | Type | Description |
|-------|------|------|-------------|
| 0 | `x` | `number` | Horizontal position as **percentage** of container width (e.g., `0`, `50.23`) |
| 1 | `y` | `number` | Vertical position in **pixels** from top of skeleton |
| 2 | `w` | `number` | Width as **percentage** of container width (e.g., `100`, `45.5`) |
| 3 | `h` | `number` | Height in **pixels** |
| 4 | `r` | `number \| string` | Border radius in px, or `'50%'` for circles |
| 5 | `c` | `boolean` (optional) | If `true`, this is a **container bone** — rendered lighter so child bones stand out |

### Example from CLI output
```json
{
  "breakpoints": {
    "375": {
      "name": "blog-card",
      "viewportWidth": 375,
      "width": 375,
      "height": 420,
      "bones": [
        [0, 0, 100, 200, 8],
        [4, 8, 30, 30, "50%"],
        [40, 8, 55, 12, 6],
        [40, 28, 45, 10, 4],
        [4, 220, 92, 14, 0],
        [4, 240, 70, 10, 0],
        [0, 0, 100, 420, 12, true]
      ]
    },
    "768": { /* different layout */ },
    "1280": { /* wide layout */ }
  }
}
```

### Object format (`Bone` interface)
```ts
export interface Bone {
  x: number      // percentage
  y: number      // pixels
  w: number      // percentage
  h: number      // pixels
  r: number | string  // border radius
  c?: boolean    // container bone flag
}
```

### `normalizeBone()` — handles both formats
```ts
export function normalizeBone(b: AnyBone): Bone {
  if (Array.isArray(b)) {
    if (b.length < 5 || b.length > 6) {
      throw new Error(`Invalid bone format: expected [x,y,w,h,r,c?] but got ${b.length} elements`)
    }
    const t = b as CompactBone
    return { x: t[0], y: t[1], w: t[2], h: t[3], r: t[4], c: t[5] || undefined }
  }
  return b
}
```

### Circle detection at render time
```ts
const capturedPxW = (b.w / 100) * (activeBones.width ?? 0)
const isCircle = b.r === '50%' && Math.abs(capturedPxW - b.h) < 4
// If circle: width = b.h * scaleY (square), not percentage
```

> Sources: [types.ts source](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/types.ts), [extract.ts source](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/extract.ts), [react.tsx source](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/react.tsx)

---

## 9. Fixture Prop: Build vs Production

### During `npx boneyard-js build` / Vite plugin capture

The CLI injects `window.__BONEYARD_BUILD = true` before page load:
```ts
// cli.js / vite.ts
await page.addInitScript(() => {
  (window as any).__BONEYARD_BUILD = true
})
```

The `<Skeleton>` component checks this:
```tsx
if (isBuildMode()) {
  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }} {...dataAttrs}>
      <div>{fixture ?? children}</div>
    </div>
  )
}
```

**During build:** Renders `fixture` (if provided) or `children`. The CLI then snapshots this rendered content. The `data-boneyard` attribute is set for CLI discovery.

### During `<BoneSuspense>` build mode
```tsx
if (isBuildMode()) {
  return (
    <div className={className} style={{ position: 'relative' }} {...dataAttrs}>
      <div>
        <Suspense fallback={fixture ?? null}>{children}</Suspense>
      </div>
    </div>
  )
}
```
Children are wrapped in `<Suspense fallback={fixture}>`. If a child suspends (e.g., `useSuspenseQuery`), the fixture renders as fallback — giving the CLI something to snapshot. The `--wait` window lets the query resolve naturally.

### In production
`window.__BONEYARD_BUILD` is never set → `isBuildMode()` returns `false` → component renders normally (loading skeleton or children). **Fixture is never rendered in production.**

### Key behaviors
- `fixture` can be `ReactNode` (JSX) or plain data (for `<Skeleton>`) — the install page shows both patterns.
- When `fixture` is provided as an array of objects (SSR docs example), it's rendered directly as children content.
- `fixture` is also stored as `data-boneyard-config` when combined with `snapshotConfig`.

> Sources: [shared.ts `isBuildMode()`](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/shared.ts), [react.tsx build mode branch](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/react.tsx), [cli.js `addInitScript`](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/bin/cli.js), [boneyard.vercel.app/ssr](https://boneyard.vercel.app/ssr)

---

## 10. Package Exports

Full exports map from `package.json`:

| Import Path | What's Exported | Purpose |
|-------------|-----------------|---------|
| `boneyard-js` | `snapshotBones`, `fromElement`, `extractResponsive`, `compileDescriptor`, `computeLayout`, `invalidateDescriptor`, `renderBones`, `skeleton()`, `registerBones`, types | Core API — DOM snapshotting, layout engine, SSR rendering |
| `boneyard-js/react` | `Skeleton`, `BoneSuspense`, `configureBoneyard`, `registerBones`, `SkeletonProps`, `BoneSuspenseProps`, `AnimationStyle` | React components + config |
| `boneyard-js/preact` | `Skeleton` (Preact-compatible) | Preact — no compat shim needed |
| `boneyard-js/vue` | `Skeleton` (Vue SFC) | Vue 3 component |
| `boneyard-js/svelte` | `Skeleton` (Svelte 5 component) | Svelte 5 component |
| `boneyard-js/angular` | `SkeletonComponent` | Angular component |
| `boneyard-js/native` | `Skeleton` (React Native) | React Native — uses `UIManager` for measurements |
| `boneyard-js/native-scan` | Native scan utilities | React Native bone scanning |
| `boneyard-js/react-native` | Alias for `boneyard-js/native` | Same as above |
| `boneyard-js/vite` | `boneyardPlugin()`, `BoneyardPluginOptions` | Vite plugin for auto-capture |
| `boneyard-js/layout` | `compileDescriptor`, `computeLayout`, `invalidateDescriptor`, `CompiledSkeletonDescriptor` | Layout engine (no DOM needed — SSR/workers/edge) |

### What lives where

- **`boneyard-js` (root)**: Low-level API. `snapshotBones()` reads `getBoundingClientRect()`. `computeLayout()` + `renderBones()` work without DOM (SSR). `registerBones()` is the shared registry (all frameworks import from here or their framework-specific path).
- **`boneyard-js/react`**: The `<Skeleton>` component. Uses `ResizeObserver`, `MutationObserver`, `matchMedia`. Registers the `__BONEYARD_SNAPSHOT` hook. Also exports `registerBones` for convenience.
- **`boneyard-js/vite`**: Vite `Plugin` that launches Playwright, captures bones, writes `.bones.json` + `registry.js`.

### Runtime dependencies
Only one: `playwright` (used by CLI and Vite plugin, not imported by the React component at runtime).

### Optional dependency
`@chenglou/pretext` (^0.0.5) — text measurement library used by the layout engine for descriptor-based bone generation.

> Sources: [package.json exports field](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/package.json), [index.ts exports](https://github.com/0xGF/boneyard/blob/main/packages/boneyard/src/index.ts), [GitHub README package exports table](https://github.com/0xGF/boneyard/blob/main/README.md)
