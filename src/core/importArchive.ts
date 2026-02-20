import Papa from "papaparse";
import { db } from "./db";
import type { VideoRow, Video } from "./types";
import { extractYouTubeVideoId, normalizeTopicCategories, parseDurationToSeconds } from "./utils";

export async function ensureArchiveLoaded(): Promise<{ loaded: boolean; count: number }> {
  const count = await db.videos.count();
  if (count > 0) return { loaded: false, count };

  const res = await fetch("./archive.csv", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load archive.csv");
  const csv = await res.text();

  const parsed = Papa.parse<VideoRow>(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  if (parsed.errors?.length) {
    console.warn("CSV parse warnings:", parsed.errors.slice(0, 5));
  }

  const videos: Video[] = (parsed.data ?? [])
    .filter((r) => r?.url && r?.title)
    .map((r) => {
      const videoId = extractYouTubeVideoId(r.url);
      const id = videoId ?? r.url;
      return {
        ...r,
        id,
        videoId,
        durationSeconds: parseDurationToSeconds(r.duration),
        topics: normalizeTopicCategories(r.Topic)
      };
    });

  // Bulk insert in chunks (keeps memory smooth on weaker devices)
  const chunkSize = 500;
  for (let i = 0; i < videos.length; i += chunkSize) {
    const chunk = videos.slice(i, i + chunkSize);
    // bulkPut overwrites safely if reimported later
    await db.videos.bulkPut(chunk);
  }

  return { loaded: true, count: videos.length };
}

export async function resetArchive(): Promise<void> {
  await db.transaction("rw", db.videos, db.flags, async () => {
    await db.videos.clear();
    await db.flags.clear();
  });
}
