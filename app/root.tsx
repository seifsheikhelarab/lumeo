import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import "./bones/registry";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap",
  },
  { rel: "icon", type: "image/jpeg", href: "/img/icon.jpg" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;
  let status: number | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{message} - Lumeo</title>
        <Meta />
        <Links />
      </head>
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        <main className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            {status && (
              <div className="text-6xl font-bold text-zinc-800 mb-4">{status}</div>
            )}
            <h1 className="text-2xl font-bold mb-3">{message}</h1>
            <p className="text-zinc-400 mb-8">{details}</p>
            {stack && import.meta.env.DEV && (
              <pre className="w-full p-4 overflow-x-auto text-left bg-zinc-900 rounded-lg text-xs text-zinc-400 mb-8">
                <code>{stack}</code>
              </pre>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Try Again
              </button>
              <a
                href="/"
                className="px-6 py-2 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Go Home
              </a>
            </div>
          </div>
        </main>
        <Scripts />
      </body>
    </html>
  );
}
