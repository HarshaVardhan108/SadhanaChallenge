# Sadhana Challenge

**Begin Your Journey Back Home, Back to Godhead**

A premium, highly animated Krishna Consciousness spiritual competition website inspired by **Goloka Vrindavan**. Not a productivity app — a living heavenly garden of devotion.

> Peace · Devotion · Happiness · Divine Love

---

## Quick start

```bash
npm install
npx convex dev          # link Convex project + write NEXT_PUBLIC_CONVEX_URL
# (keep convex dev running in one terminal)

npm run convex:seed     # optional demo users
npm run dev             # Next.js on :3000
```

### Environment

```
# Convex (required for login + app data)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Session JWT
AUTH_SECRET=change-me-in-production

# Supabase Storage only (audio, avatars, intro media) — not the database
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Logged-in data (users, challenges, streaks, shloka progress, settings, push subscriptions) is stored in **Convex**. Guests still use device-local cache. Media files remain on **Supabase Storage**.

Demo login after seed: `harsha@example.com` / `admin123`.

Open [http://localhost:3000](http://localhost:3000) → `/login` → enter the Lotus Garden.

```bash
npm run build
npm run start
```

### Deploy (Vercel)

1. Run `npx convex deploy` (or connect the Convex GitHub integration).
2. Set on Vercel:

```
NEXT_PUBLIC_CONVEX_URL=https://your-prod-deployment.convex.cloud
AUTH_SECRET=a-long-random-secret
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Redeploy after saving env vars.

### Progressive Web App (PWA)

The app is installable on mobile and desktop:

- Web App Manifest (`/manifest.webmanifest`)
- Service worker (`/sw.js`) with offline shell caching
- Install prompt (Chrome/Edge/Android) + iOS “Add to Home Screen” tip
- Icons under `public/icons/`

Serve over **HTTPS** (or `localhost`) for install + SW registration.

### Daily 9 PM push reminders

```bash
npm run push:vapid      # generate VAPID + CRON_SECRET → add to .env.local
```

Users enable reminders under **Notifications** or **Settings**.  
Cron (Supabase Edge Function or Vercel Cron) hits `POST /api/push/send-daily` hourly; pushes only fire at **21:00 Asia/Kolkata**. See `supabase/README.md`.

---

## Design system

| Token | Hex |
|-------|-----|
| Krishna Blue | `#1A4FA3` |
| Golden Yellow | `#FFD54F` |
| Warm Cream | `#FFF8E7` |
| Lotus Pink | `#FFC0CB` |
| Tulasi Green | `#6FBF73` |
| Sky Blue | `#A8E6FF` |
| Temple White | `#FAFAFA` |
| Peacock Blue | `#006D77` |
| Soft Orange | `#FFB347` |

**Fonts:** Libre Baskerville · Poppins · Noto Serif Devanagari  
**Style:** Glassmorphism + subtle golden borders · floating petals · divine light

---

## Stack

| Tech | Role |
|------|------|
| **Next.js 16** + React + TypeScript | App Router UI + API routes |
| **Convex** | Database (users, challenges, streaks, settings, push) |
| **Supabase Storage** | Audio, avatars, intro media |
| **JWT cookies** (`jose` + `bcryptjs`) | Session auth |
| **Tailwind CSS v4** | Theme & layout |
| **Framer Motion / GSAP / Three.js / Lottie** | Motion & ambient |

---

## Routes

### Auth & legal
`/login` · `/register` · `/contact` · `/privacy` · `/terms` · `/donate`

### App
| Path | Feature |
|------|---------|
| `/dashboard` | Home |
| `/challenges` | Challenges list + create |
| `/shlokas` | Shloka library + progress |
| `/profile` · `/settings` | Account |
| `/notifications` | Push reminders |
| `/invite` | Personal invite link |
| `/admin` | Admin |

### Health

`GET /api/auth/health` — checks Convex connectivity + JWT signing.

---

## Convex backend

See `convex/README.md`. Schema tables:

- `users`
- `challenges` / `challengeParticipants`
- `dailyStreaks`
- `userShlokaCompletions`
- `userSettings`
- `pushSubscriptions`

Next.js API routes call Convex via `ConvexHttpClient` (`src/lib/convex.ts`). Client components can use `useQuery` / `useMutation` through `ConvexClientProvider`.
