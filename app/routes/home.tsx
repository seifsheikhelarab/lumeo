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
    <div className="max-w-7xl mx-auto px-6 py-16">
      <section className="text-center py-20 animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
          Welcome to Lumeo V2
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          Your unified interface to discover and watch movies & TV shows
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/movies"
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-zinc-900 font-medium rounded-lg hover:scale-105 hover:bg-zinc-200 transition-all duration-200"
          >
            Browse Movies
          </Link>
          <Link
            to="/tv"
            className="inline-flex items-center justify-center px-8 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:scale-105 hover:bg-zinc-700 transition-all duration-200"
          >
            Browse TV Shows
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 py-16">
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-amber-500/30 transition-colors duration-300">
          <div className="text-3xl mb-4">⚡</div>
          <h3 className="text-lg font-semibold mb-2">Fast and Lightweight</h3>
          <p className="text-zinc-400">
            Built with a focus on performance and ease of use.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-amber-500/30 transition-colors duration-300">
          <div className="text-3xl mb-4">🔥</div>
          <h3 className="text-lg font-semibold mb-2">Trending Now</h3>
          <p className="text-zinc-400">
            Stay up-to-date with the latest releases and popular picks.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-amber-500/30 transition-colors duration-300">
          <div className="text-3xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">Seamless Search</h3>
          <p className="text-zinc-400">
            Find movies and series instantly with smart search.
          </p>
        </div>
      </section>

      <section className="mt-16 p-6 rounded-2xl bg-amber-950/20 border border-amber-500/20">
        <p className="text-sm text-amber-200/70 text-center leading-relaxed">
          This project is created strictly for educational and personal learning
          purposes only. All movie and TV show data is fetched from TMDB. Streaming
          sources are retrieved from various External APIs. I do not own, host, or
          distribute any of the content shown in this app. This project is not
          intended for commercial use and should not be used to access copyrighted
          material illegally. If you enjoy a movie or TV show you discover here,
          please support the creators by watching through legitimate streaming
          platforms.
        </p>
      </section>
    </div>
  );
}
