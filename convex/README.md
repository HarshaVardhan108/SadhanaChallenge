# Convex backend

This folder holds the Convex schema and server functions that replaced PostgreSQL.

## Setup

1. Install deps (already in root `package.json`): `npm install`
2. Log in and link a project:

```bash
npx convex dev
```

This creates `.env.local` entries:

```
NEXT_PUBLIC_CONVEX_URL=https://….convex.cloud
# optional admin deploy key for CI:
# CONVEX_DEPLOY_KEY=...
```

3. In another terminal: `npm run dev`

## Seed demo users

After Convex is running, call the seed mutation once (Dashboard → Functions, or from the Next health route after first deploy):

- `users.seedDemoUsers` with bcrypt or plain-text password hashes  
  Demo login used by the app: `harsha@example.com` / `admin123` (plain text is accepted by the auth layer for demo seeds).

## Tables

| Table | Purpose |
|-------|---------|
| `users` | Auth + profile |
| `challenges` / `challengeParticipants` | Sadhana challenges |
| `dailyStreaks` | Daily practice streak |
| `userShlokaCompletions` | Shloka progress |
| `userSettings` | User preferences |
| `pushSubscriptions` | Web Push for 9 PM reminders |

Media (audio, avatars, intro video) still uses **Supabase Storage** — only the database moved to Convex.
