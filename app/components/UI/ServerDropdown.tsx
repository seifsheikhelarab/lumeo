import { useState, useRef, useEffect } from "react";

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
  const ref = useRef<HTMLDivElement>(null);
  const current = servers.find(s => s.id === selected);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 hover:border-zinc-700 transition-colors min-w-[140px]"
      >
        <span className="flex-1 text-left">{current?.name || selected}</span>
        <svg className={`w-4 h-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-xl z-50 max-h-60 overflow-y-auto">
          {servers.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelect(s.id);
                setOpen(false);
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
      )}
    </div>
  );
}
