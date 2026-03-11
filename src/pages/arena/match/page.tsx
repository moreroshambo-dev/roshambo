import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useConvex } from "convex/react";
import { useEffect, useRef, useCallback } from "react";
import { api } from "@/convex/_generated/api.js";
import { useTelegram } from "@/components/providers/telegram.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft } from "lucide-react";
import GameScreen from "./_components/game-screen.tsx";
import VoiceChat from "./_components/voice-chat.tsx";

export default function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { telegramId } = useTelegram();
  const convex = useConvex();

  const match = useQuery(
    api.matches.getMatch,
    matchId && telegramId ? { telegramId, matchId: matchId as Id<"matches"> } : "skip",
  );

  // Track latest match state for cleanup
  const matchRef = useRef(match);
  matchRef.current = match;

  // Persist voice-chat-relevant props across loading gaps so VoiceChat stays mounted
  const voicePropsRef = useRef<{
    matchId: Id<"matches">;
    isCreator: boolean;
    matchStatus: string;
    opponentId?: Id<"users">;
  } | null>(null);

  // Update voice props whenever match data is available
  if (match) {
    voicePropsRef.current = {
      matchId: match._id,
      isCreator: match.isCreator,
      matchStatus: match.status,
      opponentId: match.isCreator ? match.opponentId : match.creatorId,
    };
  }

  // Fire leaveMatch on unmount for non-completed matches
  const fireLeave = useCallback(() => {
    const m = matchRef.current;
    if (!m || !telegramId) return;
    if (m.status === "completed" || m.status === "cancelled") return;
    if (!m.isParticipant) return;
    convex.mutation(api.matches.leaveMatch, { telegramId, matchId: m._id });
  }, [convex, telegramId]);

  useEffect(() => {
    return () => { fireLeave(); };
  }, [fireLeave]);

  useEffect(() => {
    const handler = () => { fireLeave(); };
    window.addEventListener("beforeunload", handler);
    return () => { window.removeEventListener("beforeunload", handler); };
  }, [fireLeave]);

  // Auto-navigate when nextMatchId or split matches appear (reactive)
  useEffect(() => {
    if (!match) return;

    if (match.nextMatchId) {
      navigate(`/arena/match/${match.nextMatchId}`, { replace: true });
      return;
    }

    const mySplitMatch = match.isCreator
      ? match.splitCreatorMatchId
      : match.isOpponent
        ? match.splitOpponentMatchId
        : undefined;

    if (mySplitMatch) {
      navigate(`/arena/match/${mySplitMatch}`, { replace: true });
    }
  }, [match?.nextMatchId, match?.splitCreatorMatchId, match?.splitOpponentMatchId, match?.isCreator, match?.isOpponent, navigate]);

  if (!matchId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Invalid match ID</p>
      </div>
    );
  }

  // VoiceChat rendered at page level — stays mounted even during loading
  const voiceChat = voicePropsRef.current ? (
    <div className="flex justify-center">
      <VoiceChat
        matchId={voicePropsRef.current.matchId}
        isCreator={voicePropsRef.current.isCreator}
        matchStatus={voicePropsRef.current.matchStatus}
        opponentId={voicePropsRef.current.opponentId}
      />
    </div>
  ) : null;

  if (match === undefined) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-32" />
        {/* Keep voice chat alive during loading */}
        {voiceChat}
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="flex gap-4 justify-center">
          <Skeleton className="h-24 w-24 rounded-2xl" />
          <Skeleton className="h-24 w-24 rounded-2xl" />
          <Skeleton className="h-24 w-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/arena")}
        className="mb-4 text-muted-foreground font-display tracking-wider text-xs"
      >
        <ArrowLeft className="size-4 mr-1" />
        BACK TO LOBBY
      </Button>

      {/* Voice chat at page level — persists through rematch transitions */}
      {voiceChat}
      <div className="h-3" />

      <GameScreen match={match} />
    </div>
  );
}
