import { Link } from "react-router";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  status?: number;
}

export function ErrorDisplay({ 
  title = "Something went wrong", 
  message = "An unexpected error occurred. Please try again.",
  status 
}: ErrorDisplayProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {status && (
          <div className="text-6xl font-bold text-zinc-800 mb-4">{status}</div>
        )}
        <h1 className="text-2xl font-bold mb-3">{title}</h1>
        <p className="text-zinc-400 mb-8">{message}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Try Again
          </button>
          <Link
            to="/"
            className="px-6 py-2 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export function NotFound({ resource = "Page" }: { resource?: string }) {
  return (
    <ErrorDisplay
      title={`${resource} Not Found`}
      message="The resource you're looking for doesn't exist or has been moved."
      status={404}
    />
  );
}

export function ServerError() {
  return (
    <ErrorDisplay
      title="Server Error"
      message="Something went wrong on our end. Please try again later."
      status={500}
    />
  );
}
