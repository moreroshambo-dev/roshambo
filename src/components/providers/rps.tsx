import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { createContext, useCallback, useContext, useEffect } from "react";
import { RPS_RESULT, RPS_STAGES } from "@/convex/game/rcp/libs/rps";
import { useTelegram } from "./telegram";
import type { FunctionReturnType } from "convex/server";

type GameRpsRoomStateValue = {
  room: FunctionReturnType<typeof api.game.rcp.room.get>
  leaveRoom: () => void
}

const GameRpsRoomContext = createContext<GameRpsRoomStateValue | null>(null);
export function useGameRpsRoom() {
  const context = useContext(GameRpsRoomContext);

  if (!context) {
    throw new Error("useGameRpsRoom must be used within a <GameRpsRoomProvider />");
  }

  return context;
}

export function GameRpsRoomProvider({ children }: { children: React.ReactNode }) {
  const room = useQuery(api.game.rcp.room.get)
  const leaveRoom = useMutation(api.game.rcp.room.leave)

  useEffect(() => () => {leaveRoom()}, [leaveRoom]);

  useEffect(() => {
    const handler = () => { leaveRoom(); };
    window.addEventListener("beforeunload", handler);

    return () => { window.removeEventListener("beforeunload", handler); };
  }, [leaveRoom]);
  
  if (!room) {
    return
  }

  const value: GameRpsRoomStateValue = {room, leaveRoom}

  return (
    <GameRpsRoomContext.Provider value={value}>
      {children}
    </GameRpsRoomContext.Provider>
  );
}



type UseRpsSettingsReturns = {
  setAutoSelect: (args: {enabled: boolean}) =>  Promise<null>
  toggle: () => Promise<null>
  value: FunctionReturnType<typeof api.game.rcp.settings.get>
}
const useRpsSettings = (): UseRpsSettingsReturns => {
  const value = useQuery(api.game.rcp.settings.get)
  const setAutoSelect = useMutation(api.game.rcp.settings.setAutoSelect).withOptimisticUpdate(
    (localStore, args) => {
      const { enabled } = args;
      const currentValue = localStore.getQuery(api.game.rcp.settings.get);
      if (currentValue !== undefined) {
        localStore.setQuery(api.game.rcp.settings.get, {}, {
          ...currentValue,
          autoSelectEnabled: enabled,
        });
      }
    },
  );

  const toggle = useCallback(async () => {
    if (!value || !setAutoSelect) {
      return null
    }

    await setAutoSelect({enabled: !value.autoSelectEnabled})

    return null
  }, [value, setAutoSelect])

  return {
    setAutoSelect,
    toggle,
    value: value ?? {
      autoSelectEnabled: false,
      autoSelectDuration: 2_000,
    }
  }
}



type GameRpsStateValue = {
  settings: UseRpsSettingsReturns
};

const GameRpsContext = createContext<GameRpsStateValue | null>(null);

export function useGameRps() {
  const context = useContext(GameRpsContext);

  if (!context) {
    throw new Error("useGameRps must be used within a <GameRpsProvider />");
  }

  return context;
}

export function GameRpsProvider({ children }: { children: React.ReactNode }) {
  const match = useQuery(api.game.rcp.match.get)
  const {hapticImpact, hapticNotification} = useTelegram();
  
  const submitReady = useMutation(api.game.rcp.match.submitReady)

  useEffect(() => {
    if (!match) {
      return
    }

    switch (match.stage) {
      case RPS_STAGES.WAITING: {
        // нужно отправить подтверждение
        submitReady()

        break;
      }

      case RPS_STAGES.LOCK_IN: {
        break;
      }

      case RPS_STAGES.TURN_WAIT: {
        hapticImpact('light')

        break;
      }

      case RPS_STAGES.TURN_SUBMIT: {
        break;
      }

      case RPS_STAGES.TURN_RESOLVED: {
        switch (match.result) {
          case RPS_RESULT.WIN: {
            hapticNotification("success")

            break;
          }

          case RPS_RESULT.LOSE: {
            hapticNotification("error")

            break;
          }

          case RPS_RESULT.DRAW: {
            hapticNotification("warning")

            break;
          }
        
          default: {
            break;
          }
        }
        break;
      }

      case RPS_STAGES.LAUNCH_NEXT: {

      }
    
      default: {  
        break;
      }
    }
  }, [match?.stage, submitReady, hapticNotification])

  const settings = useRpsSettings()

  return (
    <GameRpsContext.Provider
      value={{settings}}
    >
      {children}
    </GameRpsContext.Provider>
  );
}
