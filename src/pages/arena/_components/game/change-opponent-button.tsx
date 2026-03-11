import { useTelegram } from "@/components/providers/telegram";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { Loader2, Shuffle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ChangeOpponentButton() {
  const {hapticImpact} = useTelegram();
  const [isChangingOpponent, setIsChangingOpponent] = useState(false);
  const changeOpponentMut = useMutation(api.matches.changeOpponent);
  const handleChangeOpponent = async () => {
    hapticImpact("medium");
    setIsChangingOpponent(true);
  
    try {
      await changeOpponentMut();
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Failed to change opponent");
      }
    } finally {
      setIsChangingOpponent(false);
    }
  };

  return (
    <Button
      onClick={handleChangeOpponent}
      disabled={isChangingOpponent}
      className="w-full font-display tracking-wider text-xs bg-gradient-to-r from-neon-pink/80 to-neon-purple/80 hover:opacity-90 border-0 h-11 active:scale-[0.98] transition-transform"
    >
      {isChangingOpponent ? (
        <Loader2 className="size-4 mr-2 animate-spin" />
      ) : (
        <Shuffle className="size-4 mr-2" />
      )}
      {isChangingOpponent ? "CHANGING..." : "CHANGE OPPONENT"}
    </Button>
  )
}