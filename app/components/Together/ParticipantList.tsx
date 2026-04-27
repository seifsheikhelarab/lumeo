import type { Participant } from "~/services/socket";

interface ParticipantListProps {
  participants: Participant[];
  currentUserId: string;
}

export function ParticipantList({ participants, currentUserId }: ParticipantListProps) {
  return (
    <div className="bg-zinc-900/80 rounded-lg p-4 border border-zinc-800">
      <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
        Participants ({participants.length}/5)
      </h3>
      <ul className="space-y-2">
        {participants.map((participant, idx) => (
          <li
            key={participant.id || `part-${idx}`}
            className="flex items-center gap-3 text-zinc-200"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium">
              {participant.name.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate">
              {participant.name}
              {participant.id === currentUserId && " (you)"}
            </span>
            {participant.isHost && (
              <span className="text-xs bg-amber-600/20 text-amber-400 px-2 py-0.5 rounded">
                Host
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
