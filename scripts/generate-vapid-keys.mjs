/**
 * Generate VAPID keys for Web Push.
 *   node scripts/generate-vapid-keys.mjs
 * Copy the printed lines into .env.local
 */
import webpush from "web-push";
import { randomBytes } from "node:crypto";

const keys = webpush.generateVAPIDKeys();
console.log("\nAdd these to .env.local:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@bhaktichallenge.app`);
console.log(`CRON_SECRET=${randomBytes(24).toString("base64url")}`);
console.log(`PUSH_TZ=Asia/Kolkata`);
console.log(`PUSH_HOUR=21`);
console.log("");
