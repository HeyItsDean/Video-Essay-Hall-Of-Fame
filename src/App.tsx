import React, { useEffect, useMemo, useState } from "react";
import { HashRouter, NavLink, Route, Routes } from "react-router-dom";
import { ensureArchiveLoaded, resetArchive } from "./core/importArchive";
import type { Video } from "./core/types";
import { db } from "./core/db";
import { FlagsProvider, useFlags } from "./state/flags";
import { useOnlineStatus } from "./core/useOnlineStatus";
import { applyTheme, getStoredTheme, type Theme } from "./core/theme";
import { cn } from "./lib/cn";
import { CircleCheck, CloudOff, Heart, ListVideo, Moon, RefreshCcw, Sun } from "lucide-react";
import VideoExplorer from "./pages/VideoExplorer";

type ViewMode = "cards" | "compact";
type SortMode = "new" | "views" | "duration";

function AppShell() {
  const online = useOnlineStatus();
  const { flagsById, clearAllFlags } = useFlags();

  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem("vehof-view") === "compact" ? "compact" : "cards"));
  const [sortMode, setSortMode] = useState<SortMode>(() => (localStorage.getItem("vehof-sort") as SortMode) ?? "new");

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("Loading archive…");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("vehof-view", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("vehof-sort", sortMode);
  }, [sortMode]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setStatus("Waking up the archive…");
        const r = await ensureArchiveLoaded();
        setStatus(r.loaded ? `Imported ${r.count.toLocaleString()} videos` : `Loaded ${r.count.toLocaleString()} videos`);
        const all = await db.videos.toArray();
        if (!alive) return;
        setVideos(all);
      } catch (e: any) {
        console.error(e);
        setStatus(String(e?.message ?? e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const counts = useMemo(() => {
    let favorites = 0, watchLater = 0, watched = 0;
    for (const f of Object.values(flagsById)) {
      if (f.favorite) favorites++;
      if (f.watchLater) watchLater++;
      if (f.watched) watched++;
    }
    return { favorites, watchLater, watched };
  }, [flagsById]);

  const onResetAll = async () => {
    const ok = confirm("Reset everything? This clears the cached archive + your watch flags.");
    if (!ok) return;
    setLoading(true);
    await resetArchive();
    await clearAllFlags();
    const r = await ensureArchiveLoaded();
    const all = await db.videos.toArray();
    setVideos(all);
    setLoading(false);
    setStatus(`Re-imported ${r.count.toLocaleString()} videos`);
  };

  const header = (
    <div className="sticky top-0 z-20 border-b border-zinc-200/60 bg-white/75 backdrop-blur dark:border-white/5 dark:bg-zinc-950/70">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200 bg-white shadow-soft dark:border-white/10 dark:bg-white/5">
              <span className="text-sm font-semibold tracking-tight">HoF</span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold tracking-tight">
                Video Essay Hall of Fame
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                {!online ? (
                  <span className="inline-flex items-center gap-1">
                    <CloudOff className="h-3.5 w-3.5" />
                    Offline (cached)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                )}
                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                <span className="truncate">{status}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActionButton
              onClick={() => setViewMode((v) => (v === "cards" ? "compact" : "cards"))}
              title="Toggle view"
              icon={<ListVideo className="h-4 w-4" />}
              label={viewMode === "cards" ? "Cards" : "Compact"}
            />
            <ActionButton
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              title="Toggle theme"
              icon={theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              label={theme === "dark" ? "Light" : "Dark"}
            />
            <ActionButton
              onClick={onResetAll}
              title="Reset cache + flags"
              icon={<RefreshCcw className="h-4 w-4" />}
              label="Reset"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex w-full items-center gap-2 overflow-x-auto scrollbar-none sm:w-auto">
            <TabLink to="/" label="Discover" />
            <TabLink to="/watch-later" label={`Watch later (${counts.watchLater})`} icon={<ListVideo className="h-4 w-4" />} />
            <TabLink to="/favorites" label={`Favorites (${counts.favorites})`} icon={<Heart className="h-4 w-4" />} />
            <TabLink to="/watched" label={`Watched (${counts.watched})`} icon={<CircleCheck className="h-4 w-4" />} />
          </nav>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="hidden sm:inline">{videos.length.toLocaleString()} videos</span>
            <span className="text-zinc-300 dark:text-zinc-600">•</span>

            <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-soft dark:border-white/10 dark:bg-white/5">
              <span className="text-zinc-500 dark:text-zinc-400">Sort</span>
              <select
                className="bg-transparent text-zinc-900 outline-none dark:text-zinc-100"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
              >
                <option value="new">Newest</option>
                <option value="views">Most views</option>
                <option value="duration">Longest</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && videos.length === 0) {
    return (
      <div className="min-h-screen">
        {header}
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-soft dark:border-white/10 dark:bg-white/5">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Preparing the archive…</div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-violet-500/60 to-cyan-400/60" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {header}
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<VideoExplorer videos={videos} mode="discover" viewMode={viewMode} sortMode={sortMode} />} />
          <Route path="/watch-later" element={<VideoExplorer videos={videos} mode="watchLater" viewMode={viewMode} sortMode={sortMode} />} />
          <Route path="/favorites" element={<VideoExplorer videos={videos} mode="favorites" viewMode={viewMode} sortMode={sortMode} />} />
          <Route path="/watched" element={<VideoExplorer videos={videos} mode="watched" viewMode={viewMode} sortMode={sortMode} />} />
        </Routes>

        <footer className="mt-10 border-t border-zinc-200/60 pt-6 text-xs text-zinc-500 dark:border-white/5 dark:text-zinc-500">
          <p>
            Offline-first PWA • Thumbnails cache as you browse • Data + flags live in IndexedDB.
          </p>
        </footer>
      </div>
    </div>
  );
}

function ActionButton({ onClick, title, icon, label }: { onClick: () => void; title: string; icon: React.ReactNode; label: string }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm shadow-soft transition active:scale-[0.99]",
        "border-zinc-200 bg-white hover:bg-zinc-50",
        "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      )}
      onClick={onClick}
      title={title}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function TabLink({ to, label, icon }: { to: string; label: string; icon?: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "inline-flex items-center gap-2 whitespace-nowrap rounded-2xl border px-3 py-2 text-sm transition",
          "border-zinc-200 bg-white hover:bg-zinc-50",
          "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
          isActive && "border-zinc-300 bg-zinc-50 dark:border-white/20 dark:bg-white/10"
        )
      }
      end={to === "/"}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default function App() {
  return (
    <FlagsProvider>
      <HashRouter>
        <AppShell />
      </HashRouter>
    </FlagsProvider>
  );
}
