export function extractYouTubeVideoId(url: string): string | undefined {
  try {
    const u = new URL(url);
    // watch?v=
    const v = u.searchParams.get("v");
    if (v) return v;

    // youtu.be/<id>
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "").trim();
      return id || undefined;
    }

    // /shorts/<id>
    const shortsMatch = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
    if (shortsMatch) return shortsMatch[1];

    return undefined;
  } catch {
    return undefined;
  }
}

export function parseDurationToSeconds(input?: string): number | undefined {
  if (!input) return undefined;
  const s = input.trim();
  if (!s) return undefined;

  const parts = s.split(":").map((p) => p.trim());
  if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) return undefined;

  const nums = parts.map((p) => Number(p));
  if (nums.length === 2) {
    const [mm, ss] = nums;
    return mm * 60 + ss;
  }
  if (nums.length === 3) {
    const [hh, mm, ss] = nums;
    return hh * 3600 + mm * 60 + ss;
  }
  return undefined;
}

export function formatDuration(seconds?: number, fallback?: string): string {
  if (seconds == null) return fallback ?? "—";
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  if (hh > 0) return `${hh}:${pad(mm)}:${pad(ss)}`;
  return `${mm}:${pad(ss)}`;
}

export function parseNumberLoose(x?: string | number): number | undefined {
  if (x == null) return undefined;
  if (typeof x === "number") return Number.isFinite(x) ? x : undefined;
  const s = String(x).trim();
  if (!s) return undefined;
  // remove commas/spaces
  const cleaned = s.replace(/[,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

export function formatCompactNumber(n?: number): string {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
  } catch {
    // fallback
    if (n >= 1_000_000) return `${Math.round((n / 1_000_000) * 10) / 10}M`;
    if (n >= 1_000) return `${Math.round((n / 1_000) * 10) / 10}K`;
    return String(n);
  }
}

export function normalizeTopicCategories(topic?: string): string[] {
  if (!topic) return [];
  // Topics are often like: "Cinema & Live Performance, Internet & Pop Culture"
  return topic
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function uniqSorted(arr: string[]): string[] {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

export function durationBucket(seconds?: number): "short" | "medium" | "long" | "unknown" {
  if (seconds == null) return "unknown";
  if (seconds < 15 * 60) return "short";
  if (seconds < 45 * 60) return "medium";
  return "long";
}

export function thumbnailUrl(videoId?: string, size: "default" | "mq" | "hq" = "default"): string | undefined {
  if (!videoId) return undefined;
  let file = "default.jpg";
  if (size === "mq") file = "mqdefault.jpg";
  else if (size === "hq") file = "hqdefault.jpg";
  return `https://i.ytimg.com/vi/${videoId}/${file}`;
}

export function maxResThumbnailUrl(videoId?: string): string | undefined {
  if (!videoId) return undefined;
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}
