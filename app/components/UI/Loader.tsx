export function Loader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        <p className="text-zinc-400">Loading...</p>
      </div>
    </div>
  );
}
