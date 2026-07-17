import { Outlet } from "react-router";
import { useEffect } from "react";
import { bind } from "cuelume";
import { Header } from "./Header";

const TILT_MAX = 14;

function initTilt() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let current: Element | null = null;

  function track(e: PointerEvent) {
    if (reduce.matches) return;
    if (e.pointerType !== "mouse") return;
    const tilt = (e.target as Element)?.closest?.(".t-tilt") as HTMLElement | null;
    if (!tilt) { if (current) reset(current); return; }
    const card = tilt.querySelector(".t-tilt-card") as HTMLElement | null;
    if (!card) return;
    if (current && current !== tilt) reset(current);
    current = tilt;
    const r = tilt.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    tilt.classList.add("is-hover");
    card.classList.add("is-tilting");
    card.style.setProperty("--tilt-ry", ((px - 0.5) * TILT_MAX).toFixed(2) + "deg");
    card.style.setProperty("--tilt-rx", ((0.5 - py) * TILT_MAX).toFixed(2) + "deg");
    card.style.setProperty("--tilt-gx", (px * 100).toFixed(1) + "%");
    card.style.setProperty("--tilt-gy", (py * 100).toFixed(1) + "%");
  }

  function reset(el: Element) {
    const tilt = el as HTMLElement;
    const card = tilt.querySelector(".t-tilt-card") as HTMLElement | null;
    if (!card) return;
    tilt.classList.remove("is-hover");
    card.classList.remove("is-tilting");
    card.style.setProperty("--tilt-rx", "0deg");
    card.style.setProperty("--tilt-ry", "0deg");
  }

  function onLeave(e: PointerEvent) {
    if (e.pointerType === "mouse" && current) { reset(current); current = null; }
  }

  document.addEventListener("pointermove", track);
  document.addEventListener("pointerleave", onLeave, true);
  return () => {
    document.removeEventListener("pointermove", track);
    document.removeEventListener("pointerleave", onLeave, true);
  };
}

export function Layout() {
  useEffect(() => { initTilt(); bind(); }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <Header />
      <main className="pt-20">
        <Outlet />
      </main>
      <footer className="border-t border-white/5 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-zinc-500 text-sm">
            Lumeo is for educational purposes only. All content is provided by TMDB.
          </p>
        </div>
      </footer>
    </div>
  );
}
