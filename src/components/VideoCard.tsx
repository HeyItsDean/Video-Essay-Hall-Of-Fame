import React, { useMemo, useState, useRef, useEffect } from "react";
import type { Video } from "../core/types";
import { maxResThumbnailUrl, thumbnailUrl, formatCompactNumber } from "../core/utils";
import { cn } from "../lib/cn";
import { useFlags } from "../state/flags";
import { Bookmark, CheckCircle2, Heart } from "lucide-react";

export default function VideoCard({
  video,
  durationLabel,
  viewCount,
  onOwnerClick,
  isInActiveMode
}: {
  video: Video;
  durationLabel: string;
  viewCount?: number;
  onOwnerClick?: (owner: string) => void;
  isInActiveMode?: boolean;
}) {
  const { flagsById, toggleFlag } = useFlags();
  const flags = flagsById[video.id];

  const maxRes = useMemo(() => maxResThumbnailUrl(video.videoId), [video.videoId]);
  const defaultThumb = useMemo(() => thumbnailUrl(video.videoId, "default"), [video.videoId]);
  const mq = useMemo(() => thumbnailUrl(video.videoId, "mq"), [video.videoId]);
  const hq = useMemo(() => thumbnailUrl(video.videoId, "hq"), [video.videoId]);

  const [src, setSrc] = useState<string>(defaultThumb ?? mq ?? hq ?? maxRes ?? "");
  const imgRef = useRef<HTMLImageElement | null>(null);
  const upgradedRef = useRef(false);

  useEffect(() => {
    if (upgradedRef.current) return;
    const el = imgRef.current;
    if (!el) return;

    const upgradeOnce = () => {
      if (upgradedRef.current) return;
      const chain = [defaultThumb, mq, hq, maxRes].filter(Boolean) as string[];
      const idx = chain.indexOf(src);
      const next = idx >= 0 ? chain[Math.min(idx + 1, chain.length - 1)] : chain[0];
      if (next && next !== src) setSrc(next);
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

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group block overflow-hidden rounded-3xl border bg-white shadow-soft transition",
        "border-zinc-200 hover:-translate-y-0.5 hover:shadow-2xl",
        "z-0 hover:z-30",
        flags?.watched && !isInActiveMode && "filter grayscale opacity-60",
        "dark:border-white/10 dark:bg-white/5"
      )}
      title={video.title}
    >
      <div className="relative">
        {src && (
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover blur-2xl saturate-150 opacity-60"
            aria-hidden="true"
          />
        )}

        <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950/40">
          <img
            ref={imgRef}
            src={src}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover"
            onMouseEnter={() => {
              if (upgradedRef.current) return;
              const chain = [defaultThumb, mq, hq, maxRes].filter(Boolean) as string[];
              const idx = chain.indexOf(src);
              const next = idx >= 0 ? chain[Math.min(idx + 1, chain.length - 1)] : chain[0];
              if (next && next !== src) setSrc(next);
              upgradedRef.current = true;
            }}
            onError={() => {
              if (src === defaultThumb && mq) setSrc(mq);
              else if (src === mq && hq) setSrc(hq);
              else if (src === hq && maxRes) setSrc(maxRes);
            }}
          />

          {/* Top-left: channel name */}
          <div className="absolute left-2 top-2 max-w-[60%]">
            <div className="pointer-events-auto inline-flex items-center gap-1 rounded-2xl border border-white/15 bg-black/35 px-2 py-0.5 text-xs text-white backdrop-blur">
              {onOwnerClick ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOwnerClick(video.owner ?? "Unknown channel");
                  }}
                  className="text-xs font-medium hover:underline"
                >
                  {video.owner ?? "Unknown channel"}
                </button>
              ) : (
                <span className="text-xs font-medium">{video.owner ?? "Unknown channel"}</span>
              )}
            </div>
          </div>

          {/* Top-right: view count */}
          <div className="absolute right-2 top-2 pointer-events-none">
            <div className="inline-flex items-center gap-1 rounded-2xl border border-white/15 bg-black/35 px-2 py-0.5 text-xs text-white backdrop-blur">
              <span className="font-medium">{formatCompactNumber(viewCount)}</span>
            </div>
          </div>

          {/* Bottom-left: flags */}
          <div className="absolute left-2 bottom-2 flex items-center gap-1 pointer-events-auto">
            <FlagButton
              compact
              variant="watchLater"
              active={Boolean(flags?.watchLater)}
              label="Watch later"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void toggleFlag(video.id, "watchLater");
              }}
              icon={<Bookmark className="h-3 w-3" />}
            />
            <FlagButton
              compact
              variant="favorite"
              active={Boolean(flags?.favorite)}
              label="Favorite"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void toggleFlag(video.id, "favorite");
              }}
              icon={<Heart className="h-3 w-3" />}
            />
            <FlagButton
              compact
              variant="watched"
              active={Boolean(flags?.watched)}
              label="Watched"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void toggleFlag(video.id, "watched");
              }}
              icon={<CheckCircle2 className="h-3 w-3" />}
            />
          </div>

          {/* Bottom-right: duration */}
          <div className="absolute right-2 bottom-2 inline-flex items-center rounded-2xl border border-white/15 bg-black/35 px-2 py-0.5 text-xs text-white backdrop-blur">
            <span className="font-medium">{durationLabel}</span>
          </div>
        </div>
      </div>

      <div className="px-3 py-2 sm:px-3 sm:py-2">
        <div className="line-clamp-2 text-sm font-semibold leading-tight tracking-tight">
          {video.title}
        </div>
        <div className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
          {video.published_date ?? ""}
        </div>
      </div>
    </a>
  );
}

function FlagButton({
  active,
  label,
  onClick,
  icon,
  compact,
  variant
}: {
  active: boolean;
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon: React.ReactNode;
  compact?: boolean;
  variant?: "watchLater" | "favorite" | "watched";
}) {
  let hoverClasses = "hover:bg-zinc-50 dark:hover:bg-white/10";
  let activeImportant = "!border-indigo-600 !bg-indigo-50 !text-indigo-700 dark:!border-indigo-500 dark:!bg-indigo-600 dark:!text-white";

  if (variant === "watchLater") {
    hoverClasses = "hover:bg-amber-100 dark:hover:bg-amber-700/30";
    activeImportant = "!border-amber-500 !bg-amber-100 !text-amber-700 dark:!border-amber-500 dark:!bg-amber-600 dark:!text-white";
  } else if (variant === "favorite") {
    hoverClasses = "hover:bg-rose-100 dark:hover:bg-rose-700/30";
    activeImportant = "!border-rose-600 !bg-rose-100 !text-rose-700 dark:!border-rose-600 dark:!bg-rose-600 dark:!text-white";
  } else if (variant === "watched") {
    hoverClasses = "hover:bg-emerald-100 dark:hover:bg-emerald-700/30";
    activeImportant = "!border-emerald-600 !bg-emerald-100 !text-emerald-700 dark:!border-emerald-600 dark:!bg-emerald-600 dark:!text-white";
  }

  return (
    <button
      className={cn(
        compact ? "inline-flex items-center justify-center rounded-lg border p-1.5 text-xs transition" : "inline-flex items-center justify-center rounded-xl border p-2 transition",
        "border-zinc-200 bg-white",
        "dark:border-white/10 dark:bg-white/5",
        hoverClasses,
        active && activeImportant
      )}
      onClick={onClick}
      title={label}
      aria-pressed={active}
    >
      {icon}
    </button>
  );
}
