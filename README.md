# Along

Along lets you find and join group walks happening near you. Open the map to see upcoming walks in your area, tap one to view the route and who's going, and send a join request to the organizer. When your request is accepted, you get turn-by-turn walking directions to the meeting point. You can also create your own walk just, set a start and end location, choose a walk type, and let others come to you.
  
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

