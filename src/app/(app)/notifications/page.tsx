"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { PushReminder } from "@/components/pwa/PushReminder";

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Daily sadhana reminders via Web Push (Supabase-scheduled)."
        emoji="🔔"
      />

      <div className="mx-auto max-w-2xl space-y-4">
        <GlassCard strong padding="p-5">
          <PushReminder />
        </GlassCard>

        <GlassCard padding="p-5" lift={false}>
          <h2 className="font-serif text-lg font-bold text-krishna">
            How it works
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--text-muted)]">
            <li>
              Tap <strong>Enable 9 PM reminder</strong> and allow notifications.
            </li>
            <li>
              Message:{" "}
              <strong>
                Hare Krishna PR, please complete your challenge
              </strong>{" "}
              (with app logo).
            </li>
            <li>
              Sent only if you have <strong>at least one challenge</strong>{" "}
              (created or joined).
            </li>
            <li>
              Once per day at <strong>9:00 PM</strong> (Asia/Kolkata by default).
            </li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
