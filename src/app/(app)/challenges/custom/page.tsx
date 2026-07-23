"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Sparkles,
  Users,
  Target,
  Check,
} from "lucide-react";
import { OfferingToast } from "@/components/ambient/OfferingToast";
import {
  InviteDevoteesPicker,
  type InviteableUser,
} from "@/components/challenges/InviteDevoteesPicker";
import {
  buildParticipants,
  getCreatorNameFromStorage,
  getLoggedInUserProfile,
  newChallengeId,
  prependChallenge,
  challengePath,
  type SavedChallenge,
} from "@/lib/challenges";

const ACTIVITY_OPTIONS = [
  { id: "chanting", label: "Chanting (japa)", emoji: "🕉️" },
  { id: "reading", label: "Reading", emoji: "📖" },
  { id: "shlokas", label: "Learn shlokas", emoji: "📜" },
  { id: "prasadam", label: "Offer prasadam", emoji: "🍲" },
  { id: "seva", label: "Seva / service", emoji: "🙏" },
  { id: "meditation", label: "Meditation", emoji: "🧘" },
  { id: "prayer", label: "Prayer / arati", emoji: "🪔" },
  { id: "gratitude", label: "Gratitude journal", emoji: "✍️" },
] as const;

/** Custom Challenge — general spiritual goals (not shloka-picker) */
export default function CustomChallengePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [days, setDays] = useState(21);
  const [customDays, setCustomDays] = useState("");
  const [activities, setActivities] = useState<string[]>([
    "chanting",
    "reading",
    "shlokas",
  ]);
  const [selectedInvitees, setSelectedInvitees] = useState<InviteableUser[]>(
    []
  );
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [toast, setToast] = useState(false);
  const [error, setError] = useState("");

  const durationDays = customDays ? Math.max(1, Number(customDays) || 1) : days;

  const toggleActivity = (id: string) => {
    setActivities((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setError("");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (activities.length === 0) {
      setError("Select at least one daily activity.");
      return;
    }
    try {
      const inviteInputs =
        visibility === "public"
          ? selectedInvitees.map((u) => ({
              name: u.fullName,
              userId: u.id,
              email: u.email,
            }))
          : [];
      const inviteLabels = inviteInputs.map(
        (i) => i.email || i.name
      );
      const creatorName = getCreatorNameFromStorage();
      const profile = getLoggedInUserProfile();
      const payload: SavedChallenge = {
        id: newChallengeId(),
        type: "custom",
        name: name.trim() || "My Custom Challenge",
        goal: goal.trim(),
        days: durationDays,
        activities,
        activityLabels: ACTIVITY_OPTIONS.filter((a) =>
          activities.includes(a.id)
        ).map((a) => a.label),
        invites: inviteLabels,
        visibility,
        createdAt: new Date().toISOString(),
        createdBy: creatorName,
        participants: buildParticipants(
          creatorName,
          inviteInputs,
          durationDays,
          profile?.id
        ),
      };
      prependChallenge(payload);
      setToast(true);
      setTimeout(() => {
        setToast(false);
        router.push(challengePath(payload.id));
      }, 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <PageHeader
        title="Custom Challenge"
        subtitle="Design your own sadhana — choose duration, goals, and daily activities."
        emoji="🎨"
        action={
          <Button variant="outline" size="sm" onClick={() => router.push("/challenges")}>
            All Challenges
          </Button>
        }
      />

      <form onSubmit={handleCreate} className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
        <GlassCard strong className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-krishna" />
            <h2 className="font-serif text-lg font-bold text-krishna">
              Challenge details
            </h2>
          </div>
          <Input
            label="Challenge Name"
            placeholder="e.g. Kartik Month Sankalpa"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            label="Spiritual Goal"
            placeholder="What do you want to offer Krishna? e.g. deeper japa, daily reading..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </GlassCard>

        <GlassCard strong>
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-krishna" />
            <h2 className="font-serif text-lg font-bold text-krishna">
              Duration (days)
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[7, 14, 21, 30, 40, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDays(d);
                  setCustomDays("");
                }}
                className={cn(
                  "min-h-11 rounded-xl border px-4 py-2 text-sm font-medium",
                  !customDays && days === d
                    ? "border-krishna bg-krishna/10 text-krishna"
                    : "border-gold/40 bg-white"
                )}
              >
                {d} days
              </button>
            ))}
          </div>
          <div className="mt-3 max-w-xs">
            <Input
              label="Or custom days"
              type="number"
              min={1}
              max={365}
              placeholder="e.g. 18"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
            />
          </div>
          <p className="mt-2 text-sm text-peacock">
            Duration: <strong>{durationDays}</strong> days
          </p>
        </GlassCard>

        <GlassCard strong>
          <h2 className="mb-1 font-serif text-lg font-bold text-krishna">
            Daily activities
          </h2>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            Choose what you will practice each day
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ACTIVITY_OPTIONS.map((a) => {
              const on = activities.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleActivity(a.id)}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition",
                    on
                      ? "border-krishna bg-krishna/10 text-krishna"
                      : "border-gold/40 bg-white text-[var(--text-primary)]"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2",
                      on
                        ? "border-krishna bg-krishna text-white"
                        : "border-gold/50"
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="text-lg">{a.emoji}</span>
                  <span className="font-medium">{a.label}</span>
                </button>
              );
            })}
          </div>
          {error && (
            <p className="mt-3 text-sm font-medium text-rose-600" role="alert">
              {error}
            </p>
          )}
        </GlassCard>

        <GlassCard strong>
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-krishna" />
            <h2 className="font-serif text-lg font-bold text-krishna">
              Visibility
            </h2>
          </div>
          <div className="flex gap-3">
            {(["public", "private"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setVisibility(v);
                  if (v === "private") setSelectedInvitees([]);
                }}
                className={cn(
                  "min-h-11 flex-1 rounded-xl border py-2.5 capitalize",
                  visibility === v
                    ? "border-peacock bg-peacock/10 text-peacock"
                    : "border-gold/40 bg-white"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          {visibility === "public" && (
            <InviteDevoteesPicker
              selected={selectedInvitees}
              onChange={setSelectedInvitees}
            />
          )}
          {visibility === "private" && (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Private challenge — only you can access it. No invites.
            </p>
          )}
        </GlassCard>

        <GlassCard gold lift={false}>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-krishna" />
            <div className="text-sm leading-relaxed">
              <p className="font-serif text-lg font-bold text-krishna">
                Challenge summary
              </p>
              <ul className="mt-2 space-y-1 text-[var(--text-primary)]">
                <li>
                  <strong>Type:</strong> Custom Challenge
                </li>
                <li>
                  <strong>Name:</strong> {name.trim() || "My Custom Challenge"}
                </li>
                <li>
                  <strong>Days:</strong> {durationDays}
                </li>
                <li>
                  <strong>Activities:</strong>{" "}
                  {activities.length
                    ? ACTIVITY_OPTIONS.filter((a) => activities.includes(a.id))
                        .map((a) => a.label)
                        .join(", ")
                    : "None"}
                </li>
                <li>
                  <strong>Visibility:</strong> {visibility}
                </li>
                {visibility === "public" && (
                  <li>
                    <strong>Invites:</strong>{" "}
                    {selectedInvitees.length
                      ? selectedInvitees
                          .map((u) => u.fullName)
                          .join(", ")
                      : "None yet"}
                  </li>
                )}
              </ul>
            </div>
          </div>
          <Button type="submit" variant="gold" fullWidth size="lg" className="mt-5">
            ✨ Create Custom Challenge
          </Button>
        </GlassCard>
      </form>

      <OfferingToast
        show={toast}
        message="Custom challenge created — Hare Krishna!"
      />
    </div>
  );
}
