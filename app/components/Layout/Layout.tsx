import { Outlet } from "react-router";
import { Header } from "./Header";

export function Layout() {
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
