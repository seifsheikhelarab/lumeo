# Lumeo Migration: Express+EJS to React+ReactRouter

## Design Context

### Users
- **Target**: Streaming enthusiasts who want a unified interface to discover and watch movies/TV shows
- **Context**: Users access Lumeo for casual entertainment discovery without account requirements
- **Job to be done**: Browse, search, and watch streaming content with minimal friction

### Brand Personality
- **Voice**: Clean, cinematic, minimal
- **Tone**: Focus on content with theater-like experience
- **3-word personality**: Cinematic · Content-first · Refined

### Aesthetic Direction
- **Visual style**: Letterboxd/IMDB inspired - content-focused, information-rich, editorial feel
- **Theme**: Dark mode primary (cinematic), clean typography
- **Key differentiator**: Poster-centric design with generous whitespace, subtle motion

---

## Migration Overview

### Source (lumeo-v1)
- **Stack**: Express.js + EJS templates
- **Styling**: Vanilla CSS (main.style.css, detail.style.css, discover.style.css, watch.style.css)
- **Routing**: Express router with server-side rendering
- **Pages**: Home, Movies list, Movie details, Movie watch, TV list, TV details, TV watch

### Target (lumeo)
- **Stack**: React 19 + React Router 7 + TailwindCSS 4
- **Build**: Vite + React Router
- **Styling**: TailwindCSS with custom design tokens

---

## Routes Mapping

| Express (lumeo-v1)          | React Router (lumeo)       |
|-----------------------------|----------------------------|
| GET /                      | GET /                     |
| GET /movies                | GET /movies               |
| GET /movies/:id            | GET /movies/:id           |
| GET /movies/:id/watch      | GET /movies/:id/watch     |
| GET /tvshows               | GET /tv                   |
| GET /tvshows/:id           | GET /tv/:id               |
| GET /tvshows/:id/season/:season/episode/:episode | GET /tv/:id/season/:season/episode/:episode |

---

## Migration Phases

### Phase 1: Foundation
1. Configure React Router routes in `app/routes.ts`
2. Create shared layout component (Header/Navigation)
3. Set up dark theme with TailwindCSS
4. Create API service layer (reusing lumeo-v1 controllers logic or creating new API)

### Phase 2: Core Pages
1. **Home** (`/`) - Hero section, features, CTA buttons
2. **Movies List** (`/movies`) - Grid of movie posters with search, pagination
3. **Movie Details** (`/movies/:id`) - Poster, overview, cast, similar movies
4. **Movie Watch** (`/movies/:id/watch`) - Video player with source selection

### Phase 3: TV Pages
1. **TV List** (`/tv`) - Grid of TV show posters
2. **TV Details** (`/tv/:id`) - Show info, seasons, episodes
3. **TV Watch** (`/tv/:id/season/:season/episode/:episode`) - Episode player

### Phase 4: Polish
1. Loading states and error boundaries
2. Responsive design (mobile, tablet, desktop)
3. Motion/animation for page transitions
4. SEO meta tags

---

## Component Architecture

```
app/
├── components/
│   ├── Layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── Movie/
│   │   ├── MovieCard.tsx
│   │   ├── MovieGrid.tsx
│   │   ├── MovieDetails.tsx
│   │   └── MoviePlayer.tsx
│   ├── TV/
│   │   ├── TVCard.tsx
│   │   ├── TVGrid.tsx
│   │   ├── TVDetails.tsx
│   │   ├── SeasonList.tsx
│   │   └── TVPlayer.tsx
│   ├── Search/
│   │   └── SearchBar.tsx
│   └── UI/
│       ├── Button.tsx
│       ├── Pagination.tsx
│       └── Loader.tsx
├── routes/
│   ├── home.tsx
│   ├── movies/
│   │   ├── movies.tsx
│   │   ├── movies.$id.tsx
│   │   └── movies.$id.watch.tsx
│   └── tv/
│       ├── tv.tsx
│       ├── tv.$id.tsx
│       └── tv.$id.season.$season.episode.$episode.tsx
├── services/
│   └── api.ts
├── types/
│   └── index.ts
└── root.tsx
```

---

## Design Guidelines (from frontend-design skill)

### Typography
- Use distinctive display font + refined body font pairing
- Modular type scale with fluid sizing (clamp)
- Avoid: Inter, Roboto, Arial, Open Sans, system defaults

### Color & Theme
- Dark mode primary (cinematic feel)
- Use OKLCH or modern CSS color functions
- Tint neutrals toward brand hue
- Avoid: pure black (#000), pure white (#fff), cyan-on-dark gradients

### Layout & Space
- Poster-centric grid layouts
- Generous whitespace (cinematic breathing room)
- Asymmetry for emphasis where appropriate
- Avoid: card nesting, identical card grids, center-everything

### Motion
- Exponential easing (ease-out-quart/quint) for natural feel
- Staggered reveals on page load
- Height animations via grid-template-rows
- Avoid: bounce/elastic, layout property animation

### Interaction
- Progressive disclosure (basic → advanced)
- Optimistic UI updates
- Every interactive surface intentional and responsive
- Avoid: redundant headers, every button primary

---

## Key Files to Reference

### lumeo-v1 (source)
- `views/index.ejs` - Home page
- `views/movies/index.ejs` - Movies list
- `views/movies/details.ejs` - Movie details
- `views/movies/watch.ejs` - Movie player
- `views/tv/index.ejs` - TV list
- `views/tv/details.ejs` - TV details
- `views/tv/watch.ejs` - TV episode player
- `public/css/*.style.css` - Original styles

### lumeo (target)
- `app/root.tsx` - App root with layout
- `app/routes.ts` - Route configuration
- `app/routes/home.tsx` - Home route
- `app/app.css` - Global styles with Tailwind

---

## Notes

- The new frontend should reuse API logic from lumeo-v1 (or create new API endpoints)
- TMDB integration remains the same
- Streaming sources from external APIs
- Educational/personal use disclaimer should persist
