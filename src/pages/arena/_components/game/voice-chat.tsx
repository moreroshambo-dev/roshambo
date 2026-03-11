import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useTelegram } from "@/components/providers/telegram.tsx";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  PhoneIncoming,
  Loader2,
  X,
} from "lucide-react";
import { useGameRpsRoom } from "@/components/providers/rps";

/** Free Google STUN servers. For production behind symmetric NATs, add a TURN server. */
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type SignalType = "offer" | "answer" | "ice-candidate" | "voice-invite" | "voice-decline";

type ConnectionState = "idle" | "connecting" | "connected" | "failed";

export default function VoiceChat() {
  const {room} = useGameRpsRoom();
  const { hapticImpact, hapticNotification } = useTelegram();
  const sendSignalMut = useMutation(api.signals.sendSignal);
  const clearSignalsMut = useMutation(api.signals.clearSignals);

  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connState, setConnState] = useState<ConnectionState>("idle");

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteDismissed, setInviteDismissed] = useState(false);
  // Whether the opponent declined our invite
  const [opponentDeclined, setOpponentDeclined] = useState(false);

  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const processedIdsRef = useRef<Set<string>>(new Set());
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

  // ALWAYS subscribe to signals (to detect invites even when voice chat is off)
  const signals = useQuery(api.signals.getSignals);

  /* ── Helpers ─────────────────────────────────────────────── */

  const sendSignal = useCallback(
    async (type: SignalType, payload: string) => {
      try {
        await sendSignalMut({ type, payload });
      } catch {
        // Swallow – best effort signaling
      }
    },
    [sendSignalMut],
  );

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    processedIdsRef.current.clear();
    iceCandidateQueueRef.current = [];
    setConnState("idle");
  }, []);

  /** Flush queued ICE candidates after remote description is set */
  const flushIceQueue = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    for (const c of iceCandidateQueueRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {
        // ignore stale candidates
      }
    }
    iceCandidateQueueRef.current = [];
  }, []);

  /* ── Create RTCPeerConnection ───────────────────────────── */

  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal("ice-candidate", JSON.stringify(e.candidate.toJSON()));
      }
    };

    pc.ontrack = (e) => {
      if (remoteAudioRef.current && e.streams[0]) {
        remoteAudioRef.current.srcObject = e.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") {
        setConnState("connected");
        hapticNotification("success");
      } else if (s === "failed" || s === "closed") {
        setConnState("failed");
      } else if (s === "connecting" || s === "new") {
        setConnState("connecting");
      }
    };

    pcRef.current = pc;
    return pc;
  }, [sendSignal, hapticNotification]);

  /* ── Start voice chat ───────────────────────────────────── */

  const startVoiceChat = useCallback(async () => {
    if (!("mediaDevices" in navigator)) {
      toast.error("Voice chat is not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;

      const pc = createPC();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      setConnState("connecting");
      setIsActive(true);
      setShowInvite(false);

      // Notify opponent that we want to voice chat
      await sendSignal("voice-invite", "");

      // Creator sends the offer; opponent waits for it
      if (room.isCreator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal("offer", JSON.stringify(offer));
      }
    } catch {
      toast.error("Could not access microphone");
      cleanup();
    }
  }, [room.isCreator, createPC, sendSignal, cleanup]);

  /* ── Detect opponent voice invite / decline ──────────────── */

  useEffect(() => {
    if (!signals) return;

    // Detect decline — opponent dismissed our invite
    if (!opponentDeclined) {
      const hasDecline = signals.some((s) => s.type === "voice-decline");
      if (hasDecline) {
        setOpponentDeclined(true);
        // If we were connecting (waiting for them to accept), clean up
        if (isActive && connState !== "connected") {
          cleanup();
          setIsActive(false);
          setIsMuted(false);
        }
        hapticNotification("warning");
        return;
      }
    }

    // Detect invite — opponent wants to talk
    if (!isActive && !inviteDismissed && !opponentDeclined) {
      const hasInvite = signals.some((s) => s.type === "voice-invite");
      if (hasInvite && !showInvite) {
        setShowInvite(true);
        hapticNotification("success");
      }
    }
  }, [signals, isActive, inviteDismissed, showInvite, opponentDeclined, connState, cleanup, hapticNotification]);

  /* ── Process WebRTC signals ─────────────────────────────── */

  useEffect(() => {
    if (!signals || !isActive || !pcRef.current) return;

    const pc = pcRef.current;

    const processSignals = async () => {
      for (const signal of signals) {
        if (processedIdsRef.current.has(signal._id)) continue;
        processedIdsRef.current.add(signal._id);

        // Skip non-WebRTC signals
        if (signal.type === "voice-invite") continue;

        try {
          if (signal.type === "offer" && !room.isCreator) {
            const offer: RTCSessionDescriptionInit = JSON.parse(
              signal.payload,
            );
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            await flushIceQueue();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal("answer", JSON.stringify(answer));
          } else if (signal.type === "answer" && room.isCreator) {
            const answer: RTCSessionDescriptionInit = JSON.parse(
              signal.payload,
            );
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            await flushIceQueue();
          } else if (signal.type === "ice-candidate") {
            const candidate: RTCIceCandidateInit = JSON.parse(signal.payload);
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
              // Queue until remote description arrives
              iceCandidateQueueRef.current.push(candidate);
            }
          }
        } catch (err) {
          console.error("Signal processing error:", err);
        }
      }
    };

    processSignals();
  }, [signals, isActive, room.isCreator, sendSignal, flushIceQueue]);

  /* ── Mute / unmute ──────────────────────────────────────── */

  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
    hapticImpact("light");
  }, [hapticImpact]);

  /* ── End call ───────────────────────────────────────────── */

  const endCall = useCallback(() => {
    cleanup();
    setIsActive(false);
    setIsMuted(false);
    hapticImpact("medium");
    clearSignalsMut().catch(() => {});
  }, [cleanup, hapticImpact, clearSignalsMut]);

  /* ── Lifecycle ──────────────────────────────────────────── */

  // Cleanup on unmount only (leaving the page)
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Reset when match ID changes (new room = fresh state)
  useEffect(() => {
    // Only reset invite/decline/processed-signals state — keep WebRTC connection alive
    processedIdsRef.current.clear();
    setShowInvite(false);
    setInviteDismissed(false);
    setOpponentDeclined(false);
  }, [room]);

  // Full cleanup only when the actual opponent changes (different room)
  useEffect(() => {
    cleanup();
    setIsActive(false);
    setIsMuted(false);
    setShowInvite(false);
    setInviteDismissed(false);
    setOpponentDeclined(false);
    processedIdsRef.current.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  // NOTE: We intentionally do NOT cleanup on match.status change.
  // Voice chat persists through match completion as long as players stay.

  // Don't render for waiting/cancelled matches (no opponent present)
  // if (
  //   (match.status === "waiting" || match.status === "cancelled") &&
  //   !isActive &&
  //   !showInvite
  // ) {
  //   return null;
  // }

  // If opponent declined — show message, hide voice chat button
  if (opponentDeclined && !isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/30"
      >
        <PhoneOff className="size-3.5 text-muted-foreground shrink-0" />
        <span className="font-display text-[10px] tracking-wider text-muted-foreground">
          OPPONENT DECLINED VOICE CHAT
        </span>
      </motion.div>
    );
  }

  /* ── UI ─────────────────────────────────────────────────── */

  const statusColor =
    connState === "connected"
      ? "text-neon-green"
      : connState === "connecting"
        ? "text-neon-blue"
        : connState === "failed"
          ? "text-destructive"
          : "text-muted-foreground";

  const statusLabel =
    connState === "connected"
      ? "LIVE"
      : connState === "connecting"
        ? "CONNECTING"
        : connState === "failed"
          ? "FAILED"
          : "";

  return (
    <>
      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <AnimatePresence mode="wait">
        {/* ── Incoming invite banner ── */}
        {!isActive && showInvite && (
          <motion.div
            key="voice-invite"
            initial={{ scale: 0.8, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -10 }}
            className="w-full rounded-xl bg-linear-to-r from-neon-purple/20 to-neon-blue/20 border border-neon-purple/40 backdrop-blur-md p-3 space-y-2.5"
          >
            {/* Pulsing ring indicator */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <motion.span
                  animate={{
                    scale: [1, 1.8, 1],
                    opacity: [0.4, 0, 0.4],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute size-9 rounded-full border border-neon-purple/50"
                />
                <div className="size-9 rounded-full bg-neon-purple/20 border border-neon-purple/40 flex items-center justify-center">
                  <PhoneIncoming className="size-4 text-neon-purple" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-display text-xs tracking-wider text-neon-purple font-bold">
                  VOICE CHAT INVITE
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Opponent wants to talk
                </p>
              </div>

              {/* Dismiss (decline) */}
              <button
                onClick={() => {
                  setShowInvite(false);
                  setInviteDismissed(true);
                  hapticImpact("light");
                  // Notify the opponent that invite was declined
                  sendSignal("voice-decline", "");
                }}
                className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Join button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                hapticImpact("heavy");
                startVoiceChat();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neon-purple/25 border border-neon-purple/40 text-neon-purple font-display text-xs tracking-wider transition-colors hover:bg-neon-purple/35 active:bg-neon-purple/40"
            >
              <Phone className="size-4" />
              JOIN VOICE CHAT
            </motion.button>
          </motion.div>
        )}

        {/* ── Start voice button (no invite) ── */}
        {!isActive && !showInvite && (
          <motion.button
            key="start-voice"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              hapticImpact("medium");
              startVoiceChat();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon-purple/15 border border-neon-purple/30 backdrop-blur-md text-neon-purple transition-colors hover:bg-neon-purple/25 active:bg-neon-purple/30"
          >
            <Phone className="size-4" />
            <span className="font-display text-xs tracking-wider">
              VOICE CHAT
            </span>
          </motion.button>
        )}

        {/* ── Active voice controls ── */}
        {isActive && (
          <motion.div
            key="voice-controls"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center gap-2"
          >
            {/* Mute toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              className={`relative flex items-center justify-center size-10 rounded-xl border backdrop-blur-md transition-colors ${
                isMuted
                  ? "bg-destructive/15 border-destructive/30 text-destructive"
                  : "bg-neon-green/15 border-neon-green/30 text-neon-green"
              }`}
            >
              {isMuted ? (
                <MicOff className="size-4" />
              ) : (
                <Mic className="size-4" />
              )}

              {/* Pulsing indicator when live and unmuted */}
              {connState === "connected" && !isMuted && (
                <motion.span
                  animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-xl border border-neon-green/50"
                />
              )}
            </motion.button>

            {/* Status badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/40 border border-border/30 backdrop-blur-md">
              {connState === "connecting" ? (
                <Loader2 className="size-3 animate-spin text-neon-blue" />
              ) : connState === "connected" ? (
                <span className="size-2 rounded-full bg-neon-green animate-pulse" />
              ) : connState === "failed" ? (
                <span className="size-2 rounded-full bg-destructive" />
              ) : null}

              <span
                className={`font-display text-[10px] tracking-wider ${statusColor}`}
              >
                {statusLabel}
              </span>
            </div>

            {/* End call */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={endCall}
              className="flex items-center justify-center size-10 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive backdrop-blur-md transition-colors hover:bg-destructive/25"
            >
              <PhoneOff className="size-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
