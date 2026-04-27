import { useGameRpsRoom } from "@/components/providers/rps";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft } from "lucide-react";

export default function LeaveButton() {
  const {leaveRoom} = useGameRpsRoom()
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => leaveRoom()}
      className="mb-4 text-muted-foreground font-display tracking-wider text-xs"
    >
      <ArrowLeft className="size-4 mr-1" />
      BACK TO LOBBY
    </Button>
  )
}