# Sadhana Challenge

**Begin Your Journey Back Home, Back to Godhead**

A premium, highly animated Krishna Consciousness spiritual competition website inspired by **Goloka Vrindavan**. Not a productivity app — a living heavenly garden of devotion.

> Peace · Devotion · Happiness · Divine Love

---

## Quick start

```bash
npm install
npm run db:setup      # users table
npm run db:setup-app  # challenges, streaks, shlokas, settings
npm run dev
```

PostgreSQL (local defaults):

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SadhanaChallenge
DB_USER=postgres
DB_PASSWORD=admin123
AUTH_SECRET=change-me-in-production
```

### Deploy (Vercel) — required for login

Login talks to **Postgres** via the Node `pg` driver. After deploy, `localhost` is **not** your database — set a hosted connection on the host (Vercel → Project → Settings → Environment Variables):

**Preferred (Supabase / Neon / any managed Postgres):**

```
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
AUTH_SECRET=a-long-random-secret
```

Use the Supabase **Transaction pooler** URI (port **6543**) for serverless. For one-off schema setup from your machine, the **Session** or **Direct** URI is fine.

Then seed the remote DB (from your laptop, with the same `DATABASE_URL`):

```bash
# PowerShell
$env:DATABASE_URL="postgresql://..."
npm run db:setup
npm run db:setup-app
```

**Or discrete vars** (with SSL for remote hosts):

```
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_SSL=true
AUTH_SECRET=a-long-random-secret
```

Redeploy after saving env vars. Demo login after seed: `harsha@example.com` / `admin123`.

Open [http://localhost:3000](http://localhost:3000) → `/login` → enter the Lotus Garden.

Logged-in data (challenges, streaks, shloka progress, settings) is stored in **PostgreSQL**. Guests still use device-local cache.

```bash
npm run build
npm run start
```

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
npm run db:setup-app    # creates push_subscriptions table
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

## Frontend stack (implemented)

| Tech | Role |
|------|------|
| **Next.js 16** + React + TypeScript | App Router UI |
| **Tailwind CSS v4** | Theme & layout |
| **Framer Motion** | Page/card transitions |
| **GSAP** | Offering glow celebrations |
| **Three.js** | Subtle divine particle field |
| **Lottie** | Blooming lotus illustrations |
| **Lucide** | Icons |

### Planned backend (not wired yet)

| Tech | Role |
|------|------|
| ASP.NET Core Web API **or** Node.js | REST API |
| PostgreSQL | Users, progress, community |
| Firebase Auth / Google OAuth | Login |
| Firebase Cloud Messaging | Push reminders |
| Azure Blob / Firebase Storage | Audio, images |
| Vercel + Azure | Hosting |

---

## Routes

### Auth & legal
`/login` · `/register` · `/contact` · `/privacy` · `/terms` · `/donate`

### App
| Path | Feature |
|------|---------|
| `/dashboard` | Lotus Garden + daily inspiration |
| `/challenges` | Hub |
| `/challenges/7-day` | Beginner · **Silver Lotus** |
| `/challenges/21-day` | Advanced · blooming progress |
| `/challenges/custom` | Create your own |
| `/teams` | Team Radha, Govinda, Mayapur… |
| `/hearing` | Spotify-style player |
| `/shlokas` | Sanskrit + 700+ progress |
| `/reading` | Book trackers |
| `/leaderboard` | Daily → Global |
| `/community` | Haribol / Jai Prabhupada |
| `/achievements` | Collectible badges |
| `/invite` | Link, QR, WhatsApp… |
| `/analytics` | Charts + heatmap |
| `/notifications` | Mangala → quotes |
| `/profile` · `/settings` · `/admin` | Account & CMS |

### Atmosphere
- Floating petals, clouds, birds, butterflies, peacocks, cows  
- Yamuna river band, temple silhouettes, light rays, sparkles  
- Optional **flute ambience** button (bottom-right)  
- **Offering toast** when tasks are completed  

### Footer
Maha-mantra · social · Contact · Privacy · Terms · Donate · lotus / peacock / temple art

---

## Project structure

```
src/
  app/           # Routes (auth, app, legal)
  components/
    ambient/     # Vrindavan bg, Three.js, Lottie, flute, offering toast
    layout/      # Navbar, Footer, AppShell
    ui/          # Glass cards, buttons, lotus progress…
  lib/           # Mock data, GSAP helpers, utils
```

---

*All glories to Srila Prabhupada* 🙏
