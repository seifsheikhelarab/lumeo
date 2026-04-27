import { Link, NavLink } from "react-router";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="text-2xl font-bold tracking-tight text-white hover:text-white transition-colors"
        >
          Lumeo
        </Link>
        <ul className="flex items-center gap-8">
          <li>
            <NavLink
              to="/movies"
              className={({ isActive }) =>
                `text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "text-white" 
                    : "text-zinc-400 hover:text-white hover:scale-105"
                }`
              }
            >
              Movies
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/tv"
              className={({ isActive }) =>
                `text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "text-white" 
                    : "text-zinc-400 hover:text-white hover:scale-105"
                }`
              }
            >
              TV Shows
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}