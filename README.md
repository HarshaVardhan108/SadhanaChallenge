# Bhakti Challenge

**Begin Your Journey Back Home, Back to Godhead**

A premium, highly animated Krishna Consciousness spiritual competition website inspired by **Goloka Vrindavan**. Not a productivity app — a living heavenly garden of devotion.

> Peace · Devotion · Happiness · Divine Love

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → `/login` → enter the Lotus Garden.

```bash
npm run build
npm run start
```

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
