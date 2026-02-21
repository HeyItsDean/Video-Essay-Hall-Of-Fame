import React, { useMemo, useState } from "react";
import type { Video } from "../core/types";
import { maxResThumbnailUrl, thumbnailUrl, formatCompactNumber } from "../core/utils";
import { cn } from "../lib/cn";
import { useFlags } from "../state/flags";
import { Bookmark, CheckCircle2, Heart, Play } from "lucide-react";

export default function VideoCard({
  video,
  durationLabel,
  viewCount
}: {
  video: Video;
  durationLabel: string;
  viewCount?: number;
}) {
  const { flagsById, toggleFlag } = useFlags();
  const flags = flagsById[video.id];

  const maxRes = useMemo(() => maxResThumbnailUrl(video.videoId), [video.videoId]);
  const defaultThumb = useMemo(() => thumbnailUrl(video.videoId, "default"), [video.videoId]);
  const mq = useMemo(() => thumbnailUrl(video.videoId, "mq"), [video.videoId]);
  const hq = useMemo(() => thumbnailUrl(video.videoId, "hq"), [video.videoId]);

  // Default to 'default' for speed, fallback to mq/hq/maxres
  const [src, setSrc] = useState(defaultThumb ?? mq ?? hq ?? maxRes ?? "");

  const primaryTopic = video.topics?.[0];

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group block overflow-hidden rounded-3xl border bg-white shadow-soft transition",
        "border-zinc-200 hover:-translate-y-0.5 hover:shadow-2xl",
        "dark:border-white/10 dark:bg-white/5"
      )}
      title={video.title}
    >
      <div className="relative">
        {/* Blurred background (prevents black bars if aspect differs) */}
        {src && (
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover blur-2xl saturate-150 opacity-60"
            aria-hidden="true"
          />
        )}

        <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950/40">
          {mq && (
            <img
              src={src}
              srcSet={hq ? `${mq} 1x, ${hq} 2x` : undefined}
              alt={video.title}
              loading="lazy"
              className="h-full w-full object-contain"
              onError={() => {
                // fallbacks: maxres -> hq -> mq
                if (src === maxRes && hq) setSrc(hq);
                else if (src !== mq && mq) setSrc(mq);
              }}
            />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-70" />

          <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-black/35 px-3 py-1.5 text-xs text-white backdrop-blur">
            <Play className="h-3.5 w-3.5" />
            <span className="font-medium">{durationLabel}</span>
          </div>

          {primaryTopic && (
            <div className="absolute right-3 top-3 rounded-2xl border border-white/15 bg-black/35 px-3 py-1.5 text-xs text-white backdrop-blur">
              {primaryTopic}
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight">
          {video.title}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="min-w-0 truncate">
            {video.owner ?? "Unknown channel"}
          </div>
          <div className="shrink-0">{formatCompactNumber(viewCount)}</div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {video.published_date ?? ""}
          </div>

          <div className="flex items-center gap-1">
            <FlagButton
              active={Boolean(flags?.watchLater)}
              label="Watch later"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void toggleFlag(video.id, "watchLater");
              }}
              icon={<Bookmark className="h-4 w-4" />}
            />
            <FlagButton
              active={Boolean(flags?.favorite)}
              label="Favorite"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void toggleFlag(video.id, "favorite");
              }}
              icon={<Heart className="h-4 w-4" />}
            />
            <FlagButton
              active={Boolean(flags?.watched)}
              label="Watched"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void toggleFlag(video.id, "watched");
              }}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>
    </a>
  );
}

function FlagButton({
  active,
  label,
  onClick,
  icon
}: {
  active: boolean;
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl border p-2 transition",
        "border-zinc-200 bg-white hover:bg-zinc-50",
        "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
        active && "border-zinc-300 bg-zinc-50 text-zinc-900 dark:border-white/20 dark:bg-white/10 dark:text-white"
      )}
      onClick={onClick}
      title={label}
      aria-pressed={active}
    >
      {icon}
    </button>
  );
}
