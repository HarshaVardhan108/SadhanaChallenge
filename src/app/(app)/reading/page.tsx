"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { books } from "@/lib/data";

export default function ReadingPage() {
  return (
    <div>
      <PageHeader
        title="Reading Challenge"
        subtitle="Start from zero — open a book and begin your journey with the parampara."
        emoji="📖"
      />

      <GlassCard gold className="mb-5 text-center sm:mb-6" padding="p-4" lift={false}>
        <p className="font-serif text-lg font-bold text-krishna">0% overall progress</p>
        <p className="text-sm text-[var(--text-muted)]">
          No pages logged yet. Pick a book to begin.
        </p>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        {books.map((book) => (
          <GlassCard key={book.id} className="flex flex-col">
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg shadow-md sm:h-20 sm:w-14"
                style={{
                  background: `linear-gradient(160deg, ${book.color}, ${book.color}99)`,
                }}
              >
                <span className="text-2xl">📕</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-base font-bold text-krishna sm:text-lg">
                  {book.title}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {book.chapters} chapters · {book.progress}% complete
                </p>
                <ProgressBar
                  value={book.progress}
                  color={book.color}
                  className="mt-3"
                  showLabel={false}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="primary" size="sm" className="min-h-11 flex-1">
                Start Reading
              </Button>
              <Button variant="outline" size="sm" className="min-h-11">
                Log minutes
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
