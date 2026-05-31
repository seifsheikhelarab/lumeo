import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { getMovies, getImageUrl } from "~/services/api";

export async function loader({}: Route.LoaderArgs) {
  const data = await getMovies(null, 1);
  return { trending: data.results.slice(0, 6) };
}

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
  const { trending } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="max-w-2xl mb-16">
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

          <div className="animate-fade-in-up" style={{ animationDelay: "500ms" }}>
            <p className="text-xs uppercase tracking-widest text-zinc-600 mb-5">
              Trending Now
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {trending.map((movie, idx) => (
                <Link
                  key={movie.id}
                  to={`/movies/${movie.id}`}
                  className="group block"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="aspect-[2/3] rounded-md overflow-hidden bg-zinc-900">
                    <img
                      src={getImageUrl(movie.poster_path, "w342")}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      width={200}
                      height={300}
                    />
                  </div>
                  <h3 className="font-medium text-xs text-zinc-500 truncate mt-2 group-hover:text-zinc-300 transition-colors">
                    {movie.title}
                  </h3>
                </Link>
              ))}
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