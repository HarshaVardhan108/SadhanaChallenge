"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";

const notifications = [
  {
    icon: "🪔",
    title: "Mangala Arati",
    body: "It's 4:25 AM — time for Mangala Arati. Hare Krishna!",
    time: "Today · 4:25 AM",
    unread: true,
  },
  {
    icon: "📿",
    title: "Japa Reminder",
    body: "You have 4 rounds left to complete your goal of 16.",
    time: "Today · 10:00 AM",
    unread: true,
  },
  {
    icon: "📖",
    title: "Reading Reminder",
    body: "10 minutes with Bhagavad Gita — Chapter 9 awaits.",
    time: "Today · 7:00 PM",
    unread: false,
  },
  {
    icon: "🎧",
    title: "Lecture Reminder",
    body: "Continue: Morning Walk — Juhu Beach 1975",
    time: "Yesterday",
    unread: false,
  },
  {
    icon: "🎉",
    title: "Festival Reminder",
    body: "Ratha Yatra is in 7 days! Special challenge unlocked.",
    time: "Yesterday",
    unread: true,
  },
  {
    icon: "🌙",
    title: "Ekadashi Reminder",
    body: "Ekadashi in 8 days. Prepare your fasting sankalpa.",
    time: "2 days ago",
    unread: false,
  },
  {
    icon: "✨",
    title: "Motivational Quote",
    body: '"Chanting, dancing and feasting — this is the simple process." — Srila Prabhupada',
    time: "2 days ago",
    unread: false,
  },
];

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Gentle reminders for a steady spiritual life."
        emoji="🔔"
      />

      <div className="mx-auto max-w-2xl space-y-3">
        {notifications.map((n, i) => (
          <GlassCard
            key={i}
            padding="p-4"
            className={n.unread ? "border-l-4 border-l-gold" : "opacity-90"}
          >
            <div className="flex gap-3">
              <span className="text-2xl">{n.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-krishna">{n.title}</p>
                  {n.unread && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-saffron" />
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{n.body}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">{n.time}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
