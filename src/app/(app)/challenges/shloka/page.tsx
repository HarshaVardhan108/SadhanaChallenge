"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import {
  LOCAL_SHLOKA_BOOKS,
  getBookFromList,
  getChapterFromBook,
  type CatalogBook,
  type CatalogShloka,
} from "@/lib/shloka-catalog";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Users,
  CalendarDays,
  Sparkles,
  Loader2,
} from "lucide-react";
import { OfferingToast } from "@/components/ambient/OfferingToast";
import {
  buildParticipants,
  getCreatorNameFromStorage,
  getLoggedInUserProfile,
  newChallengeId,
  prependChallenge,
  challengePath,
  type SavedChallenge,
} from "@/lib/challenges";

/** Shloka Challenge — book, chapter, multi-select shlokas, days, invite */
export default function ShlokaChallengePage() {
  const router = useRouter();
  const [books, setBooks] = useState<CatalogBook[]>(LOCAL_SHLOKA_BOOKS);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSource, setCatalogSource] = useState<"storage" | "local">(
    "local"
  );
  const [name, setName] = useState("");
  const [bookId, setBookId] = useState(LOCAL_SHLOKA_BOOKS[0]?.id ?? "bg");
  const [chapterNumber, setChapterNumber] = useState(
    LOCAL_SHLOKA_BOOKS[0]?.chapters[0]?.number ?? 1
  );
  const [selectedShlokaIds, setSelectedShlokaIds] = useState<string[]>([]);
  const [days, setDays] = useState(7);
  const [customDays, setCustomDays] = useState("");
  const [invites, setInvites] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [toast, setToast] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shlokas");
        const data = (await res.json()) as {
          ok?: boolean;
          source?: "storage" | "local";
          books?: CatalogBook[];
        };
        if (cancelled || !data.books?.length) return;
        setBooks(data.books);
        setCatalogSource(data.source ?? "local");
        const first = data.books[0];
        setBookId(first.id);
        setChapterNumber(first.chapters[0]?.number ?? 1);
        setSelectedShlokaIds([]);
      } catch {
        /* keep local fallback */
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const book = useMemo(() => getBookFromList(books, bookId), [books, bookId]);
  const chapter = useMemo(
    () => getChapterFromBook(book, chapterNumber),
    [book, chapterNumber]
  );

  const selectedShlokas = useMemo(() => {
    const all: CatalogShloka[] = book.chapters.flatMap((c) => c.shlokas);
    return all.filter((s) => selectedShlokaIds.includes(s.id));
  }, [book, selectedShlokaIds]);

  const durationDays = customDays ? Math.max(1, Number(customDays) || 1) : days;

  const toggleShloka = (id: string) => {
    setSelectedShlokaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setError("");
  };

  const onBookChange = (id: string) => {
    setBookId(id);
    const b = getBookFromList(books, id);
    setChapterNumber(b.chapters[0]?.number ?? 1);
    setSelectedShlokaIds([]);
    setError("");
  };

  const onChapterChange = (num: number) => {
    setChapterNumber(num);
    setSelectedShlokaIds([]);
    setError("");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedShlokaIds.length === 0) {
      setError("Please select at least one shloka.");
      return;
    }
    try {
      const inviteList =
        visibility === "public"
          ? invites
              .split(/[,;\n]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      const creatorName = getCreatorNameFromStorage();
      const profile = getLoggedInUserProfile();
      const payload: SavedChallenge = {
        id: newChallengeId(),
        type: "shloka",
        name: name.trim() || `${book.shortName} Shloka Challenge`,
        bookId,
        bookName: book.shortName,
        chapterNumber,
        shlokaIds: selectedShlokaIds,
        shlokas: selectedShlokas.map((s) => s.label),
        days: durationDays,
        invites: inviteList,
        visibility,
        createdAt: new Date().toISOString(),
        createdBy: creatorName,
        participants: buildParticipants(
          creatorName,
          inviteList,
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
        title="Shloka Challenge"
        subtitle="Pick a book, chapter, and shlokas. Set days and invite devotees."
        emoji="📜"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/challenges")}
          >
            All Challenges
          </Button>
        }
      />

      <form
        onSubmit={handleCreate}
        className="mx-auto max-w-2xl space-y-4 sm:space-y-6"
      >
        <GlassCard strong>
          <Input
            label="Challenge Name"
            placeholder="e.g. Chapter 2 Memory Sankalpa"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </GlassCard>

        <GlassCard strong className="space-y-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-krishna" />
            <h2 className="font-serif text-lg font-bold text-krishna">
              Book, Chapter & Shlokas
            </h2>
            {catalogLoading && (
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-peacock" />
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Catalog:{" "}
            {catalogSource === "storage"
              ? "Supabase Storage"
              : "Local fallback"}
          </p>

          <Select
            label="1. Book"
            value={bookId}
            onChange={(e) => onBookChange(e.target.value)}
          >
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.shortName}
              </option>
            ))}
          </Select>
          <p className="text-xs text-[var(--text-muted)]">
            Currently available: Bhagavad Gita
          </p>

          <Select
            label="2. Chapter"
            value={String(chapterNumber)}
            onChange={(e) => onChapterChange(Number(e.target.value))}
          >
            {book.chapters.map((ch) => (
              <option key={ch.number} value={ch.number}>
                Chapter {ch.number}
                {ch.shlokas.length ? ` (${ch.shlokas.length})` : ""}
              </option>
            ))}
          </Select>

          <div>
            <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">
              3. Select Shloka(s)
              {selectedShlokaIds.length > 0 && (
                <span className="ml-2 font-normal text-peacock">
                  ({selectedShlokaIds.length} selected)
                </span>
              )}
            </p>
            {catalogLoading ? (
              <p className="text-sm text-[var(--text-muted)]">
                Loading shlokas…
              </p>
            ) : chapter.shlokas.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No shlokas in this chapter.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {chapter.shlokas.map((s) => {
                  const checked = selectedShlokaIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                        checked
                          ? "border-krishna bg-krishna/10 text-krishna"
                          : "border-gold/40 bg-white text-[var(--text-primary)] active:bg-cream"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleShloka(s.id)}
                        className="h-4 w-4 accent-krishna"
                      />
                      <span>{s.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm font-medium text-rose-600" role="alert">
              {error}
            </p>
          )}
        </GlassCard>

        <GlassCard strong>
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-krishna" />
            <h2 className="font-serif text-lg font-bold text-krishna">
              Select Days
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[3, 7, 14, 21, 30, 40].map((d) => (
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
              label="Or custom number of days"
              type="number"
              min={1}
              max={365}
              placeholder="e.g. 18"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
            />
          </div>
          <p className="mt-2 text-sm text-peacock">
            Duration: <strong>{durationDays}</strong> day
            {durationDays === 1 ? "" : "s"}
          </p>
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
                  if (v === "private") setInvites("");
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
            <div className="mt-4">
              <Input
                label="Invite Devotees (emails or names, comma-separated)"
                placeholder="friend@example.com, Temple Group..."
                value={invites}
                onChange={(e) => setInvites(e.target.value)}
              />
            </div>
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
                  <strong>Type:</strong> Shloka Challenge
                </li>
                <li>
                  <strong>Book:</strong> {book.shortName}
                </li>
                <li>
                  <strong>Chapter:</strong> {chapter.number}
                </li>
                <li>
                  <strong>Shlokas:</strong>{" "}
                  {selectedShlokas.length
                    ? selectedShlokas.map((s) => s.label).join(", ")
                    : "None selected"}
                </li>
                <li>
                  <strong>Days:</strong> {durationDays}
                </li>
                <li>
                  <strong>Visibility:</strong> {visibility}
                </li>
              </ul>
            </div>
          </div>
          <Button
            type="submit"
            variant="gold"
            fullWidth
            size="lg"
            className="mt-5"
          >
            ✨ Create Shloka Challenge
          </Button>
        </GlassCard>
      </form>

      <OfferingToast
        show={toast}
        message="Shloka challenge created — Hare Krishna!"
      />
    </div>
  );
}
