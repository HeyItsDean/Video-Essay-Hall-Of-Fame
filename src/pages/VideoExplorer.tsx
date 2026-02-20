import React, { useMemo, useState } from "react";
import Fuse from "fuse.js";
import type { Video } from "../core/types";
import { durationBucket, formatCompactNumber, formatDuration, parseNumberLoose, uniqSorted } from "../core/utils";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useFlags } from "../state/flags";
import VideoCard from "../components/VideoCard";
import VideoRow from "../components/VideoRow";
import { cn } from "../lib/cn";
import { Filter, Search, X } from "lucide-react";

type Mode = "discover" | "watchLater" | "favorites" | "watched";
type ViewMode = "cards" | "compact";
type SortMode = "new" | "views" | "duration";

export default function VideoExplorer({
  videos,
  mode,
  viewMode,
  sortMode
}: {
  videos: Video[];
  mode: Mode;
  viewMode: ViewMode;
  sortMode: SortMode;
}) {
  const { flagsById } = useFlags();

  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query, 140);

  const [showFilters, setShowFilters] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [durationFilters, setDurationFilters] = useState<Array<"short" | "medium" | "long">>([]);

  const allTopics = useMemo(() => {
    const topics: string[] = [];
    for (const v of videos) topics.push(...(v.topics ?? []));
    return uniqSorted(topics);
  }, [videos]);

  const base = useMemo(() => {
    if (mode === "discover") return videos;

    const want = mode === "favorites" ? "favorite" : mode === "watchLater" ? "watchLater" : "watched";
    return videos.filter((v) => Boolean(flagsById[v.id]?.[want]));
  }, [videos, mode, flagsById]);

  const fuse = useMemo(() => {
    return new Fuse(base, {
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
      useExtendedSearch: false,
      keys: [
        { name: "title", weight: 0.45 },
        { name: "owner", weight: 0.18 },
        { name: "Topic", weight: 0.20 },
        { name: "tags", weight: 0.08 },
        { name: "gpt_tags", weight: 0.05 },
        { name: "Summary", weight: 0.04 }
      ]
    });
  }, [base]);

  const searched = useMemo(() => {
    if (!q.trim()) return base;
    const res = fuse.search(q.trim());
    return res.map((r) => r.item);
  }, [q, base, fuse]);

  const filtered = useMemo(() => {
    return searched.filter((v) => {
      if (selectedTopics.length > 0) {
        // OR match: any selected topic present
        const set = new Set(v.topics ?? []);
        const ok = selectedTopics.some((t) => set.has(t));
        if (!ok) return false;
      }
      if (durationFilters.length > 0) {
        const b = durationBucket(v.durationSeconds);
        if (b === "unknown") return false;
        if (!durationFilters.includes(b)) return false;
      }
      return true;
    });
  }, [searched, selectedTopics, durationFilters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const byNew = (a: Video, b: Video) => (b.published_date ?? "").localeCompare(a.published_date ?? "");
    const byViews = (a: Video, b: Video) => (parseNumberLoose(b.view_count) ?? 0) - (parseNumberLoose(a.view_count) ?? 0);
    const byDuration = (a: Video, b: Video) => (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0);

    if (sortMode === "views") arr.sort(byViews);
    else if (sortMode === "duration") arr.sort(byDuration);
    else arr.sort(byNew);

    return arr;
  }, [filtered, sortMode]);

  const title = mode === "discover" ? "Discover" : mode === "favorites" ? "Favorites" : mode === "watchLater" ? "Watch later" : "Watched";

  const subtitle = useMemo(() => {
    const n = sorted.length;
    const baseN = base.length;
    if (mode === "discover") return `${n.toLocaleString()} results`;
    return `${n.toLocaleString()} of ${baseN.toLocaleString()} in this list`;
  }, [sorted.length, base.length, mode]);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold tracking-tight">{title}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</div>
          </div>

          <button
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition",
              "border-zinc-200 bg-white hover:bg-zinc-50",
              "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            )}
            onClick={() => setShowFilters((s) => !s)}
          >
            <Filter className="h-4 w-4" />
            <span>{showFilters ? "Hide filters" : "Show filters"}</span>
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-zinc-950/40">
          <Search className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            placeholder="Search title, channel, topic, tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          {query.trim() && (
            <button
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-200"
              onClick={() => setQuery("")}
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Topic</div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {allTopics.map((t) => (
                  <Chip
                    key={t}
                    active={selectedTopics.includes(t)}
                    onClick={() => {
                      setSelectedTopics((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
                    }}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
              {selectedTopics.length > 0 && (
                <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Filtering by: <span className="font-medium">{selectedTopics.join(", ")}</span>
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Duration</div>
              <div className="flex flex-wrap gap-2">
                <Chip active={durationFilters.includes("short")} onClick={() => toggleDur("short")}>Short (&lt; 15m)</Chip>
                <Chip active={durationFilters.includes("medium")} onClick={() => toggleDur("medium")}>Medium (15–45m)</Chip>
                <Chip active={durationFilters.includes("long")} onClick={() => toggleDur("long")}>Long (45m+)</Chip>
                {durationFilters.length > 0 && (
                  <button
                    className="ml-1 text-xs text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
                    onClick={() => setDurationFilters([])}
                  >
                    clear
                  </button>
                )}
              </div>
            </div>

            {(selectedTopics.length > 0 || durationFilters.length > 0) && (
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Active filters: {selectedTopics.length + durationFilters.length}
                </div>
                <button
                  className="text-xs font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-200"
                  onClick={() => {
                    setSelectedTopics([]);
                    setDurationFilters([]);
                  }}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {sorted.length === 0 ? (
        <EmptyState mode={mode} />
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              viewCount={parseNumberLoose(v.view_count)}
              durationLabel={formatDuration(v.durationSeconds, v.duration)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-200 bg-white shadow-soft dark:border-white/10 dark:bg-white/5">
          <div className="divide-y divide-zinc-200/60 dark:divide-white/10">
            {sorted.map((v) => (
              <VideoRow
                key={v.id}
                video={v}
                viewCount={parseNumberLoose(v.view_count)}
                durationLabel={formatDuration(v.durationSeconds, v.duration)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  function toggleDur(d: "short" | "medium" | "long") {
    setDurationFilters((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs transition",
        "border-zinc-200 bg-white hover:bg-zinc-50",
        "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
        active && "border-zinc-300 bg-zinc-50 dark:border-white/20 dark:bg-white/10"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function EmptyState({ mode }: { mode: "discover" | "watchLater" | "favorites" | "watched" }) {
  const label = mode === "discover" ? "No matches" : "Nothing here yet";
  const hint =
    mode === "discover"
      ? "Try fewer filters, or search with fewer words."
      : "Mark videos with Watch later / Favorite / Watched to build your lists.";

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-soft dark:border-white/10 dark:bg-white/5">
      <div className="text-base font-semibold">{label}</div>
      <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{hint}</div>
    </div>
  );
}
