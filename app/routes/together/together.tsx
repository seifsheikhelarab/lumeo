import { useState } from "react";
import { useNavigate, useSearchParams, useRevalidator } from "react-router";

export function meta() {
  return [
    { title: "Watch Together - Lumeo" },
    { name: "description", content: "Watch movies and TV shows together" },
  ];
}

export default function TogetherCreate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const contentId = searchParams.get("contentId");
  const contentType = searchParams.get("contentType");
  const season = searchParams.get("season");
  const episode = searchParams.get("episode");
  const [userName, setUserName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (!userName.trim()) return;
    setIsCreating(true);

    const tempRoomId = "CREATE";
    const params = new URLSearchParams({ contentId: contentId || "", contentType: contentType || "" });
    if (season) params.set("season", season);
    if (episode) params.set("episode", episode);
    const url = `/together/${tempRoomId}?${params.toString()}`;
    navigate(url, { state: { userName: userName.trim(), isCreating: true } });
  };

  if (!contentId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-xl p-8 max-w-md w-full border border-zinc-800 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Watch Together</h1>
          <p className="text-zinc-400 mb-6">
            Please select a movie or episode to watch together from the Lumeo catalog.
          </p>
          <a
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl p-8 max-w-md w-full border border-zinc-800">
        <h1 className="text-2xl font-bold text-white mb-2">Start Watch Party</h1>
        <p className="text-zinc-400 mb-6">
          Create a room and invite friends to watch {contentType === "movie" ? "this movie" : "this episode"} together.
        </p>

        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Your name"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 mb-4"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />

        <button
          onClick={handleCreate}
          disabled={!userName.trim() || isCreating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
        >
          {isCreating ? "Creating..." : "Create Party"}
        </button>
      </div>
    </div>
  );
}
