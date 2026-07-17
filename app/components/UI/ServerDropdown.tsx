import { useState, useRef, useEffect, useCallback } from "react";

interface Server {
  id: string;
  name: string;
  baseUrl: string;
}

interface ServerDropdownProps {
  servers: Server[];
  selected: string;
  onSelect: (id: string) => void;
}

export function ServerDropdown({ servers, selected, onSelect }: ServerDropdownProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = servers.find(s => s.id === selected);

  const closeMs = typeof document !== "undefined"
    ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dropdown-close-dur")) || 150
    : 150;

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setClosing(true);
    setTimeout(() => setClosing(false), closeMs);
  }, [closeMs]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closeDropdown]);

  const dropdownClass = open ? "is-open" : closing ? "is-closing" : "";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          if (open) {
            closeDropdown();
          } else {
            setClosing(false);
            setOpen(true);
          }
        }}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 hover:border-zinc-700 transition-colors min-w-[140px]"
        data-cuelume-toggle
      >
        <span className="flex-1 text-left">{current?.name || selected}</span>
        <svg className={`w-4 h-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`t-dropdown absolute top-full left-0 mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-xl z-50 max-h-60 overflow-y-auto ${dropdownClass}`} data-origin="bottom-left">
        {servers.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              onSelect(s.id);
              closeDropdown();
            }}
            className={`w-full px-3 py-2 text-sm text-left transition-colors ${
              s.id === selected
                ? "bg-white text-zinc-900"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
