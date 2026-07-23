"use client";

import { useEffect, useMemo, useState } from "react";
import { Select } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Loader2, UserPlus, X } from "lucide-react";

export type InviteableUser = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  temple: string | null;
  city: string | null;
};

type InviteDevoteesPickerProps = {
  /** Selected registered users to invite */
  selected: InviteableUser[];
  onChange: (next: InviteableUser[]) => void;
  className?: string;
};

function credentialsLine(u: InviteableUser): string {
  const parts: string[] = [];
  if (u.email) parts.push(u.email);
  if (u.phone) parts.push(u.phone);
  if (u.temple) parts.push(u.temple);
  else if (u.city) parts.push(u.city);
  return parts.join(" · ") || "No contact on file";
}

function optionLabel(u: InviteableUser): string {
  const creds = [u.email, u.phone].filter(Boolean).join(" · ");
  return creds ? `${u.fullName} — ${creds}` : u.fullName;
}

/**
 * Dropdown of registered devotees (name + email/phone) for public challenge invites.
 * Multi-select: pick from dropdown, remove via chips.
 */
export function InviteDevoteesPicker({
  selected,
  onChange,
  className,
}: InviteDevoteesPickerProps) {
  const [users, setUsers] = useState<InviteableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropdownValue, setDropdownValue] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/users");
        const data = (await res.json()) as {
          users?: InviteableUser[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setUsers([]);
          setError(
            data.error ||
              (res.status === 401
                ? "Log in to see devotees you can invite."
                : "Could not load users.")
          );
          return;
        }
        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch {
        if (!cancelled) {
          setUsers([]);
          setError("Could not load users. Check your connection and database.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedIds = useMemo(
    () => new Set(selected.map((u) => u.id)),
    [selected]
  );

  const available = useMemo(
    () => users.filter((u) => !selectedIds.has(u.id)),
    [users, selectedIds]
  );

  const addFromDropdown = (userId: string) => {
    if (!userId) return;
    const u = users.find((x) => x.id === userId);
    if (!u || selectedIds.has(u.id)) {
      setDropdownValue("");
      return;
    }
    onChange([...selected, u]);
    setDropdownValue("");
  };

  const remove = (userId: string) => {
    onChange(selected.filter((u) => u.id !== userId));
  };

  return (
    <div className={cn("mt-4 space-y-3", className)}>
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 shrink-0 text-peacock" />
        <div>
          <p className="text-sm font-semibold text-krishna">Invite devotees</p>
          <p className="text-xs text-[var(--text-muted)]">
            Choose from registered users — name, email, and phone shown
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-cream/50 px-3 py-3 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin text-peacock" />
          Loading devotees…
        </div>
      ) : error ? (
        <p
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700"
          role="alert"
        >
          {error}
        </p>
      ) : users.length === 0 ? (
        <p className="rounded-xl border border-gold/30 bg-cream/50 px-3 py-3 text-sm text-[var(--text-muted)]">
          No other registered devotees yet. When someone signs up, they will
          appear in this dropdown.
        </p>
      ) : (
        <>
          <Select
            label="Select devotee to invite"
            value={dropdownValue}
            disabled={available.length === 0}
            onChange={(e) => {
              const id = e.target.value;
              setDropdownValue(id);
              addFromDropdown(id);
            }}
          >
            <option value="">
              {available.length === 0
                ? "All available devotees selected"
                : "— Choose a devotee —"}
            </option>
            {available.map((u) => (
              <option key={u.id} value={u.id}>
                {optionLabel(u)}
              </option>
            ))}
          </Select>

          {selected.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Invited ({selected.length})
              </p>
              <ul className="flex flex-wrap gap-2">
                {selected.map((u) => (
                  <li
                    key={u.id}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-krishna/25 bg-krishna/10 py-1 pl-2.5 pr-1 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium text-krishna">
                      {u.fullName}
                    </span>
                    <span className="hidden max-w-[10rem] truncate text-xs text-[var(--text-muted)] sm:inline">
                      {credentialsLine(u)}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(u.id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-krishna transition hover:bg-krishna hover:text-white"
                      aria-label={`Remove ${u.fullName}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
