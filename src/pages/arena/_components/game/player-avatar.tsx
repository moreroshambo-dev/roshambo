import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { User } from "lucide-react";

export function PlayerAvatar({
  name,
  label,
  url,
  gradient,
}: {
  name: string;
  label: string;
  url?: string;
  gradient: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (!url) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    const img = new Image();
    setStatus("loading");

    img.onload = () => {
      if (!cancelled) setStatus("success");
    };
    img.onerror = () => {
      if (!cancelled) setStatus("error");
    };
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [url]);

  const showImage = status === "success";
  const showLoader = status === "loading";

  return (
    <div className="flex flex-col items-center gap-1 pointer-events-none select-none">
      <div
        className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg overflow-hidden`}
      >
        {/* Image layer */}
        {showImage && (
          <motion.img
            key={url}
            src={url}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        )}

        {/* Loader while image resolves */}
        {showLoader && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
            <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Fallback icon (visible when no image or load failed) */}
        {!showImage && (
          <motion.div
            initial={{ opacity: 0.7, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10"
          >
            <User className="size-5 text-white" />
          </motion.div>
        )}
      </div>
      <span className="text-xs text-foreground font-medium truncate max-w-[80px] text-center">
        {name}
      </span>
      <span className="text-[9px] text-muted-foreground font-display tracking-wider">
        {label}
      </span>
    </div>
  );
}
