import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Lumeo - Watch Movies & TV Shows Online" },
    { name: "description", content: "Discover and stream movies and TV shows free. Browse popular titles, search for favorites, and watch instantly with multiple streaming servers." },
    { property: "og:title", content: "Lumeo - Watch Movies & TV Shows Online" },
    { property: "og:description", content: "Discover and stream movies and TV shows free. Browse popular titles, search for favorites, and watch instantly." },
    { property: "og:type", content: "website" },
    { name: "keywords", content: "movies, tv shows, streaming, free movies, watch online, cinema" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-widest text-zinc-500 mb-4 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
              Streaming Interface
            </p>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: "100ms", fontFamily: 'var(--font-display)' }}>
              Lumeo
            </h1>
            <p className="text-xl text-zinc-400 mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              Discover and watch movies & TV shows with an interface built for content, not clutter.
            </p>
            <div className="flex gap-4 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <Link
                to="/movies"
                className="px-6 py-3 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Browse Movies
              </Link>
              <Link
                to="/tv"
                className="px-6 py-3 text-zinc-300 font-medium rounded-lg border border-zinc-700 hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                TV Shows
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-xs text-zinc-600 max-w-xl leading-relaxed">
            Educational project. Content from TMDB. Streaming sources from external APIs.
            Do not use for unauthorized access to copyrighted material.
          </p>
        </div>
      </footer>
    </div>
  );
}