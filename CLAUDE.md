# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Build and run on iOS simulator
npm run lint       # ESLint check
```

There is no test suite configured. The app is iOS-only (portrait orientation).

## Architecture Overview

**Along** is a React Native/Expo app for coordinating group walks. It uses Expo Router for file-based routing, Supabase for backend/auth/realtime, Mapbox for maps, and NativeWind for Tailwind-style CSS.

### Routing

Expo Router with two route groups:
- `/` → redirects to `/sign-in`
- `/(roots)/(tabs)/` → main tabs (map, activity, profile) — protected by `AuthGuard`
- `/(roots)/walks/[id]` — walk detail screen
- `/(roots)/create_walks` — create walk

`components/AuthGaurd.tsx` wraps the root layout and redirects unauthenticated users to `/sign-in` using `useSegments()`.

### Auth & Session

`context/AuthContext.tsx` owns auth state (user, session, loading). It listens to `supabase.auth.onAuthStateChange()` and persists sessions via AsyncStorage. Sign-in is Google OAuth → Supabase IdToken conversion (`sign-in.tsx`).

### Theme

`context/ThemeContext.tsx` provides a `colors` object (primary, secondary, accent, surface, text, black, danger palettes) that adapts to system light/dark mode. These same color names are also registered in `tailwind.config.js` for use with NativeWind class names. Custom fonts are the Rubik family, loaded in `app/_layout.tsx`.

### Data Layer

- **`libs/supabase.ts`** — Supabase client with AsyncStorage session persistence
- **`hooks/useWalks.ts`** — fetches upcoming walks + subscribes to `postgres_changes` for realtime updates; manages `selectedWalkId`
- **`hooks/useReverseGeocode.ts`** — two-tier address lookup: Supabase RPC `get_building_from_coords` first, then Edge Function `reverse_geocode` (Mapbox proxy) as fallback
- **`hooks/useRouting.ts`** — fetches walking routes from a Supabase Edge Function; backend supports both OpenRouteService and GraphHopper (toggled by `EXPO_PUBLIC_ROUTING_FUNCTION`)
- **`libs/geometry.ts`** — Haversine distance, ray-casting point-in-polygon, distance formatting, estimated walk time (5 km/h)

### Key Data Types (`constants/types.ts`)

```ts
Walk      { id, start/end location strings, start/end lat/lng, route (GeoJSON), status, walk_type, max_walkers }
Profile   { id, user_name, avatar, verified, total_walks, rating, connections }
WalkRequest { id, walk_id, requester_id, owner_id, status ("pending"|"accepted"|"declined"|"cancelled") }
```

### Map Screen (`app/(roots)/(tabs)/map.tsx`)

The most complex file (~400 lines). Composes most hooks together: walk data, routing, reverse geocoding, camera control, and route animation. There is a known `//TODO fix hook dependency arrays` comment at the top of the file.

### Environment Variables

All secrets live in `.env.local`. Client-side vars use the `EXPO_PUBLIC_` prefix:

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_KEY
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
EXPO_PUBLIC_ROUTING_FUNCTION   # "get-route" (ORS) or "get-route-gh" (GraphHopper)
RNMAPBOX_MAPS_DOWNLOAD_TOKEN   # private, used only at build time in app.config.js
```

### Styling Conventions

NativeWind class names map to Tailwind utilities. Custom theme tokens (`primary`, `secondary`, etc.) are available as both Tailwind class names and via the `useTheme()` hook for inline styles. Custom border-radius presets: `rounded-card` (16px), `rounded-button` (12px). Custom spacing: `p-safe` (16), `p-card` (20).
