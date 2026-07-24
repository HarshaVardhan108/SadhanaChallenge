# Supabase Edge Function — daily 9 PM reminders

This function calls your Next.js app every hour. The app only **sends** pushes when a subscriber’s local time is **9:00 PM** (`PUSH_HOUR=21`, `PUSH_TZ=Asia/Kolkata`).

## 1. Deploy the function

```bash
# From repo root (requires Supabase CLI + linked project)
supabase functions deploy daily-reminder
```

## 2. Set secrets

```bash
supabase secrets set APP_URL=https://sadhana-challenge-mu.vercel.app
supabase secrets set CRON_SECRET=same-value-as-nextjs-CRON_SECRET
```

## 3. Schedule (Dashboard)

**Supabase Dashboard → Edge Functions → daily-reminder → Cron Jobs**

| Schedule | Meaning |
|----------|---------|
| `5 * * * *` | Every hour at :05 (recommended) |
| `0 15,16 * * *` | Around 9 PM IST only (UTC 15–16) |

Or via SQL (pg_cron + `net.http_post` if enabled on your project).

## 4. App env (Next.js / Vercel)

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com
CRON_SECRET=...
PUSH_TZ=Asia/Kolkata
PUSH_HOUR=21
```

Generate keys: `npm run push:vapid`

## 5. User flow

1. Open **Notifications** or **Settings** in the app  
2. Tap **Enable 9 PM reminder** → allow browser notifications  
3. Subscription is stored in Postgres `push_subscriptions`  
4. Cron hits `POST /api/push/send-daily` → Web Push delivered  

## Test manually

```bash
curl -X POST http://localhost:3000/api/push/send-daily \
  -H "Authorization: Bearer $CRON_SECRET"
```

To force a test at any hour, temporarily set `PUSH_HOUR` to the current hour in Asia/Kolkata.
