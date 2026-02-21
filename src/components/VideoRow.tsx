import React, { useMemo, useState } from "react";
import type { Video } from "../core/types";
import { formatCompactNumber, maxResThumbnailUrl, thumbnailUrl } from "../core/utils";
import { cn } from "../lib/cn";
import { useFlags } from "../state/flags";
import { Bookmark, CheckCircle2, Heart } from "lucide-react";

export default function VideoRow({
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
        "group flex gap-4 p-4 transition hover:bg-zinc-50 dark:hover:bg-white/5"
      )}
      title={video.title}
    >
      <div className="relative w-40 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-zinc-950/40">
        {src && (
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-60"
            aria-hidden="true"
          />
        )}
        <div className="relative aspect-video w-full">
          {mq && (
            <img
              src={src}
              srcSet={hq ? `${mq} 1x, ${hq} 2x` : undefined}
              alt={video.title}
              loading="lazy"
              className="h-full w-full object-contain"
              onError={() => {
                if (src === maxRes && hq) setSrc(hq);
                else if (src !== mq && mq) setSrc(mq);
              }}
            />
          )}
          <div className="absolute bottom-2 right-2 rounded-xl border border-white/15 bg-black/40 px-2 py-1 text-[11px] text-white backdrop-blur">
            {durationLabel}
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight">
          {video.title}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="truncate">{video.owner ?? "Unknown channel"}</span>
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
          <span>{formatCompactNumber(viewCount)} views</span>
          {primaryTopic && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">•</span>
              <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] dark:border-white/10 dark:bg-white/5">
                {primaryTopic}
              </span>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{video.published_date ?? ""}</div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <FlagButton
              active={Boolean(flags?.watchLater)}
              label="Watch later"
              onClick={(e) => {
                e.preventDefault();
                void toggleFlag(video.id, "watchLater");
              }}
              icon={<Bookmark className="h-4 w-4" />}
            />
            <FlagButton
              active={Boolean(flags?.favorite)}
              label="Favorite"
              onClick={(e) => {
                e.preventDefault();
                void toggleFlag(video.id, "favorite");
              }}
              icon={<Heart className="h-4 w-4" />}
            />
            <FlagButton
              active={Boolean(flags?.watched)}
              label="Watched"
              onClick={(e) => {
                e.preventDefault();
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
