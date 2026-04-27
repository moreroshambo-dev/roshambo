import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion } from "motion/react";
import LobbyScreen from "./_components/lobby/lobby-screen.tsx";
import LeaveButton from "./_components/leave-button.tsx";
import VoiceChat from "./_components/game/voice-chat.tsx";
import GameScreen from "./_components/game/game-screen.tsx";
import WaitOpponentScreen from "./_components/wait-opponent-screen.tsx";
import { GameRpsRoomProvider } from "@/components/providers/rps.tsx";

export default function ArenaLobby() {
  const room = useQuery(api.game.rcp.room.get);

  return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {!room ? (
          <LobbyScreen/>
        ): (
          <GameRpsRoomProvider>
            {room?.status === 'active' ? (
              <div className="max-w-lg mx-auto px-4 py-6">
                <LeaveButton/>

                <div className="flex justify-center">
                  <VoiceChat/>
                </div>
                <div className="h-3" />

                <GameScreen />
              </div>
            ) : (
              <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
                <LeaveButton/>
                <WaitOpponentScreen />
              </div>
            )}
          </GameRpsRoomProvider>
        )}
      </motion.div>
  );
}
