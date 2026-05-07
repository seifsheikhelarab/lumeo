# Lumeo Migration: React+ReactRouter

## Key Commands
- `npm run dev`: start dev server with React Router
- `npm run build`: build production bundle
- `npm run typecheck`: generate typegen and run TypeScript

## Architecture
- Entry point: `app/root.tsx`
- Routes defined in `app/routes.ts`
- API layer in `app/services/api.ts`
- Tailwind CSS in `app/app.css`
- Live Socket.IO used for real‑time features

## Setup
- Install deps: `npm install`
- Ensure Node 20+ is used
- Environment vars: `.env` for ABLY key, JWT secret, etc.

## Testing
- No dedicated test framework configured. Use `npm test` if added.

## Gotchas
- React Router `build` and `dev` scripts require `react-router` 7.
- `typecheck` runs both `react-router typegen` and `tsc`. Change order only if issues.
- Socket.IO client/server require same version.

## Conventions
- Components in `app/components/*` follow PascalCase.
- Pages in `app/routes/*` use React Router extensions.
- Tailwind classes are used directly; no styled‑components.

## Troubleshooting
- If build fails, run `npm run typecheck` to see type errors.
- For server errors, check Socket.IO port conflicts.

---

This file aids future sessions; keep updated with any script changes.
