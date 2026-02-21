import React, { useMemo, useState, useRef, useEffect } from "react";
import type { Video } from "../core/types";
import { maxResThumbnailUrl, thumbnailUrl, formatCompactNumber } from "../core/utils";
import { cn } from "../lib/cn";
import { useFlags } from "../state/flags";
import { Bookmark, CheckCircle2, Heart, Play } from "lucide-react";

export default function VideoCard({
  video,
  durationLabel,
  viewCount,
  onOwnerClick
}: {
  video: Video;
  durationLabel: string;
  viewCount?: number;
  onOwnerClick?: (owner: string) => void;
}) {
  const { flagsById, toggleFlag } = useFlags();
  const flags = flagsById[video.id];

  const maxRes = useMemo(() => maxResThumbnailUrl(video.videoId), [video.videoId]);
  const defaultThumb = useMemo(() => thumbnailUrl(video.videoId, "default"), [video.videoId]);
  const mq = useMemo(() => thumbnailUrl(video.videoId, "mq"), [video.videoId]);
  const hq = useMemo(() => thumbnailUrl(video.videoId, "hq"), [video.videoId]);

  // Use the low-quality "default" thumb initially for bandwidth savings.
  // Fall back progressively on error to slightly higher-res versions.
  const [src, setSrc] = useState<string>(defaultThumb ?? mq ?? hq ?? maxRes ?? "");
  const imgRef = useRef<HTMLImageElement | null>(null);
  const upgradedRef = useRef(false);

  // Upgrade to the next-higher quality when the card enters the viewport
  // or on hover. Only upgrade by one step (not jump to maxres).
  useEffect(() => {
    if (upgradedRef.current) return;
    const el = imgRef.current;
    if (!el) return;

    const upgradeOnce = () => {
      if (upgradedRef.current) return;
      // determine current index in the quality chain
      const chain = [defaultThumb, mq, hq, maxRes].filter(Boolean) as string[];
      const idx = chain.indexOf(src);
      const next = idx >= 0 ? chain[Math.min(idx + 1, chain.length - 1)] : chain[0];
      if (next && next !== src) {
        setSrc(next);
      }
      upgradedRef.current = true;
    };

    if (typeof IntersectionObserver !== "undefined") {
      const obs = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            upgradeOnce();
            obs.unobserve(e.target);
          }
        }
      });
      obs.observe(el);
      return () => obs.disconnect();
    }

    return undefined;
  }, [defaultThumb, mq, hq, maxRes, src]);

  const primaryTopic = video.topics?.[0];

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group block overflow-hidden rounded-3xl border bg-white shadow-soft transition",
        "border-zinc-200 hover:-translate-y-0.5 hover:shadow-2xl",
        "z-0 hover:z-30",
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
          {/* Always render the img (using the low-res `src`) and avoid a large srcSet
              so browsers don't eagerly download high-res images. We progressively
              upgrade on load errors. */}
          <img
            ref={imgRef}
            src={src}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover"
            onMouseEnter={() => {
              // hover-triggered single-step upgrade
              if (upgradedRef.current) return;
              const chain = [defaultThumb, mq, hq, maxRes].filter(Boolean) as string[];
              const idx = chain.indexOf(src);
              const next = idx >= 0 ? chain[Math.min(idx + 1, chain.length - 1)] : chain[0];
              if (next && next !== src) setSrc(next);
              upgradedRef.current = true;
            }}
            onError={() => {
              // progressive fallbacks: default -> mq -> hq -> maxRes
              if (src === defaultThumb && mq) setSrc(mq);
              else if (src === mq && hq) setSrc(hq);
              else if (src === hq && maxRes) setSrc(maxRes);
            }}
          />

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
            {onOwnerClick ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOwnerClick(video.owner ?? "Unknown channel");
                }}
                className="text-sm font-medium hover:underline"
              >
                {video.owner ?? "Unknown channel"}
              </button>
            ) : (
              video.owner ?? "Unknown channel"
            )}
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
        active && "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-600 dark:text-white"
      )}
      onClick={onClick}
      title={label}
      aria-pressed={active}
    >
      {icon}
    </button>
  );
}
