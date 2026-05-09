# Along

A React Native app for coordinating group walks. Find nearby walks, join others, and track routes in real time.

## Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 54) |
| Routing | Expo Router (file-based) |
| Backend / Auth | Supabase (Postgres, Realtime, Edge Functions) |
| Maps | Mapbox via `@rnmapbox/maps` |
| Styling | NativeWind (Tailwind v3) |
| Auth Provider | Google OAuth → Supabase |

## Prerequisites

- Node.js 18+
- Xcode (iOS simulator)
- Expo CLI (`npm install -g expo-cli`)
- A `.env.local` file (see below)

## Setup

```bash
npm install
npm run ios        # build and open in iOS simulator
npm start          # start Expo dev server only
npm run lint       # ESLint
```

> The app is iOS-only.

## Environment Variables

Create `.env.local` at the project root:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_KEY=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=
EXPO_PUBLIC_ROUTING_FUNCTION=   # "get-route" (OpenRouteService) or "get-route-gh" (GraphHopper)
RNMAPBOX_MAPS_DOWNLOAD_TOKEN=   # build-time only, not exposed to client
```

## Project Structure

```
app/
  index.tsx                  # redirects to /sign-in
  sign-in.tsx                # Google OAuth entry point
  (roots)/
    (tabs)/
      map.tsx                # main map screen (walk discovery + routing)
      activity.tsx           # walk feed
      profile/               # user profile and settings
    walks/[id].tsx            # upcoming walk detail
    create_walks.tsx          # walk creation flow

components/
  AuthGaurd.tsx              # redirects unauthenticated users
  WalkModal.tsx              # bottom sheet for walk details
  WalkPins.tsx               # Mapbox annotation layer

hooks/
  useWalks.ts                # fetches walks + Supabase Realtime subscription
  useRouting.ts              # fetches walking routes from Edge Function
  useReverseGeocode.ts       # address lookup (Supabase RPC → Edge Function fallback)
  useMapCamera.ts            # camera control helpers
  useRouteAnimation.ts       # animated route drawing

context/
  AuthContext.tsx            # session state, onAuthStateChange listener
  ThemeContext.tsx           # light/dark color tokens

libs/
  supabase.ts                # Supabase client (AsyncStorage session persistence)
  geometry.ts                # Haversine distance, point-in-polygon, formatting

constants/
  types.ts                   # Walk, Profile, WalkRequest types
```

## Key Data Types

```ts
Walk         { id, start/end location, start/end lat/lng, route (GeoJSON), status, walk_type, max_walkers }
Profile      { id, user_name, avatar, verified, total_walks, rating, connections }
WalkRequest  { id, walk_id, requester_id, owner_id, status: "pending"|"accepted"|"declined"|"cancelled" }
```

## Theme

`ThemeContext` exposes a `colors` object with `primary`, `secondary`, `accent`, `surface`, `text`, `black`, and `danger` palettes that adapt to system light/dark mode. The same tokens are registered in `tailwind.config.js` so they work as NativeWind class names too.

Custom presets: `rounded-card` (16px), `rounded-button` (12px), `p-safe` (16), `p-card` (20).
