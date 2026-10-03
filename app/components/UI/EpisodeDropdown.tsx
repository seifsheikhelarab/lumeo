import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { getTVSeason, getImageUrl, imgErrorHandler } from "~/services/api";
import type { Episode } from "~/types";

export interface SeasonOption {
  season_number: number;
  name: string;
  episode_count: number;
}

interface EpisodeDropdownProps {
  showId: string;
  seasons: SeasonOption[];
  currentSeason: number;
  currentEpisode: number;
  initialEpisodes: Episode[];
}

function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes) return "";
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
}

export function EpisodeDropdown({
  showId,
  seasons,
  currentSeason,
  currentEpisode,
  initialEpisodes,
}: EpisodeDropdownProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [viewSeason, setViewSeason] = useState(currentSeason);
  const [cache, setCache] = useState<Record<number, Episode[]>>({ [currentSeason]: initialEpisodes });
  const [loadingSeason, setLoadingSeason] = useState<number | null>(null);
  const [loadFailed, setLoadFailed] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  const closeMs =
    typeof document !== "undefined"
      ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dropdown-close-dur")) || 150
      : 150;

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setClosing(true);
    setTimeout(() => setClosing(false), closeMs);
  }, [closeMs]);

  // Route params change on every episode navigation — reset to the new season and close.
  useEffect(() => {
    setViewSeason(currentSeason);
    setOpen(false);
    setClosing(false);
    setLoadFailed(null);
    setCache((prev) => (prev[currentSeason] ? prev : { ...prev, [currentSeason]: initialEpisodes }));
  }, [currentSeason, initialEpisodes]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeDropdown();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeDropdown]);

  useEffect(() => {
    if (!open || !activeRef.current) return;
    const raf = requestAnimationFrame(() =>
      activeRef.current?.scrollIntoView({ block: "center" })
    );
    return () => cancelAnimationFrame(raf);
  }, [open, viewSeason]);

  const selectViewSeason = (seasonNumber: number) => {
    setViewSeason(seasonNumber);
    if (cache[seasonNumber]) return;
    setLoadingSeason(seasonNumber);
    setLoadFailed(null);
    getTVSeason(showId, seasonNumber)
      .then((details) =>
        setCache((prev) => ({ ...prev, [seasonNumber]: details.episodes }))
      )
      .catch((err) => {
        console.error("Failed to load season:", err);
        setLoadFailed(seasonNumber);
      })
      .finally(() => setLoadingSeason(null));
  };

  const episodes = cache[viewSeason] ?? [];
  const isCurrentView = viewSeason === currentSeason;
  const dropdownClass = open ? "is-open" : closing ? "is-closing" : "";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          if (open) closeDropdown();
          else {
            setClosing(false);
            setViewSeason(currentSeason);
            setOpen(true);
          }
        }}
        className="flex items-center gap-2 px-4 min-h-[44px] bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 hover:border-zinc-700 transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
        data-cuelume-toggle
      >
        <span className="font-plex-mono text-zinc-400">
          S{currentSeason} E{currentEpisode}
        </span>
        <span className="hidden sm:inline text-zinc-500 truncate max-w-[180px]">
          {initialEpisodes.find((e) => e.episode_number === currentEpisode)?.name || "Episodes"}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 w-[min(90vw,420px)] z-[60]">
        <div
          className={`t-dropdown bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl z-[60] ${dropdownClass}`}
          data-origin="top-center"
        >
          {seasons.length > 1 && (
            <div className="flex gap-1 overflow-x-auto p-1.5 border-b border-zinc-800">
              {seasons.map((s) => (
                <button
                  key={s.season_number}
                  onClick={() => selectViewSeason(s.season_number)}
                  className={`shrink-0 min-w-[44px] min-h-[40px] px-2 rounded-md text-sm font-medium transition-colors ${
                    s.season_number === viewSeason
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                >
                  S{s.season_number}
                </button>
              ))}
            </div>
          )}

          {loadingSeason === viewSeason ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-11 rounded-md animate-shimmer bg-zinc-800/60" />
              ))}
            </div>
          ) : loadFailed === viewSeason ? (
            <div className="p-4 text-center space-y-2">
              <p className="text-sm text-zinc-500">Could not load this season.</p>
              <button
                onClick={() => selectViewSeason(viewSeason)}
                className="min-h-[44px] px-4 text-sm text-zinc-300 hover:text-white transition-colors"
              >
                Try again
              </button>
            </div>
          ) : episodes.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500 text-center">No episodes listed.</p>
          ) : (
            <ul
              className="max-h-[min(60vh,380px)] overflow-y-auto"
              aria-label={`Season ${viewSeason} episodes`}
            >
              {episodes.map((ep) => {
                const isActive =
                  isCurrentView && ep.episode_number === currentEpisode && ep.episode_number > 0;
                return (
                  <li key={ep.id}>
                    <Link
                      ref={isActive ? activeRef : undefined}
                      to={`/tv/${showId}/season/${viewSeason}/episode/${ep.episode_number}`}
                      onClick={closeDropdown}
                      className={`flex items-center gap-3 px-3 min-h-[44px] transition-colors ${
                        isActive
                          ? "bg-white text-zinc-900"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                      }`}
                      data-cuelume-hover="tick"
                    >
                      {ep.still_path && (
                        <img
                          src={getImageUrl(ep.still_path, "w92")}
                          alt=""
                          className="w-14 h-8 object-cover rounded flex-shrink-0"
                          onError={imgErrorHandler}
                        />
                      )}
                      <span className="font-plex-mono text-xs w-9 flex-shrink-0 opacity-70">
                        E{ep.episode_number}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-sm">
                        {ep.name || `Episode ${ep.episode_number}`}
                      </span>
                      {ep.runtime ? (
                        <span className="text-xs opacity-60 flex-shrink-0">
                          {formatRuntime(ep.runtime)}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
