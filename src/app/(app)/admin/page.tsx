"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Users,
  Sparkles,
  Headphones,
  BookOpen,
  Calendar,
  Bell,
  Trophy,
  MapPin,
  BarChart3,
  FileText,
  Flag,
} from "lucide-react";

const modules = [
  { name: "Manage Users", icon: Users, desc: "Approve, suspend, roles" },
  { name: "Approve Challenges", icon: Sparkles, desc: "Custom challenge review" },
  { name: "Upload Lectures", icon: Headphones, desc: "Audio library CMS" },
  { name: "Upload Shlokas", icon: BookOpen, desc: "Sanskrit content" },
  { name: "Manage Books", icon: FileText, desc: "Reading tracks" },
  { name: "Festivals", icon: Calendar, desc: "Calendar & countdowns" },
  { name: "Notifications", icon: Bell, desc: "Push & reminders" },
  { name: "Reports", icon: Flag, desc: "Moderation queue" },
  { name: "Leaderboards", icon: Trophy, desc: "Reset & seasons" },
  { name: "Temple Management", icon: MapPin, desc: "Locations & schedules" },
  { name: "Analytics", icon: BarChart3, desc: "Platform insights" },
  { name: "CMS", icon: FileText, desc: "Quotes, pages, banners" },
];

export default function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Admin Panel"
        subtitle="Manage the spiritual platform with care and devotion."
        emoji="🛡️"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <GlassCard gold padding="p-4" lift={false}>
          <p className="text-xs text-[var(--text-muted)]">Active devotees</p>
          <p className="font-serif text-3xl font-bold text-krishna">0</p>
        </GlassCard>
        <GlassCard padding="p-4" lift={false}>
          <p className="text-xs text-[var(--text-muted)]">Pending approvals</p>
          <p className="font-serif text-3xl font-bold text-peacock">0</p>
        </GlassCard>
        <GlassCard padding="p-4" lift={false}>
          <p className="text-xs text-[var(--text-muted)]">Reports open</p>
          <p className="font-serif text-3xl font-bold text-saffron">0</p>
        </GlassCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <GlassCard key={m.name} className="cursor-pointer">
              <Icon className="h-6 w-6 text-krishna" />
              <h3 className="mt-3 font-semibold text-krishna">{m.name}</h3>
              <p className="text-sm text-[var(--text-muted)]">{m.desc}</p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
