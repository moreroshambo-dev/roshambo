import { useState } from "react";
import { motion } from "motion/react";
import { Copy, Check, Send, MessageCircle, Share2, Link, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const MOCK_REFERRAL_LINK = "https://rp.app/ref/CRY5T4L_K1NG";
const MOCK_PROMO_CODE = "CRYSTAL25";
const DEFAULT_MESSAGE = "Join me on RPS Arena and get 500 free tokens! Use my link to sign up and we both earn rewards.";

export default function InviteFriendsPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const handleCopy = (text: string, type: "link" | "code") => {
    navigator.clipboard.writeText(text).catch(() => {
      // fallback - do nothing
    });
    setCopied(type);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = (platform: string) => {
    const encodedMessage = encodeURIComponent(`${message}\n\n${MOCK_REFERRAL_LINK}`);
    const urls: Record<string, string> = {
      telegram: `https://t.me/share/url?url=${encodeURIComponent(MOCK_REFERRAL_LINK)}&text=${encodeURIComponent(message)}`,
      whatsapp: `https://wa.me/?text=${encodedMessage}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
    };
    window.open(urls[platform], "_blank");
  };

  return (
    <div className="max-w-lg mx-auto px-3 sm:px-4 py-5 space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <button
          onClick={() => navigate("/referral")}
          className="p-2 rounded-xl bg-card/60 border border-border/40 hover:bg-secondary/60 transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4 text-foreground" />
        </button>
        <div>
          <h1 className="font-display font-bold text-lg tracking-[0.2em] text-foreground uppercase">
            Invite Friends
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Share your link and earn together</p>
        </div>
      </motion.div>

      {/* Referral link */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl bg-card/60 border border-border/40 backdrop-blur-xl p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Link className="size-4 text-neon-green" />
          <span className="font-display font-bold text-xs tracking-[0.15em] text-neon-green uppercase">
            Your Referral Link
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl bg-secondary/60 border border-border/30 px-3 py-2.5 overflow-hidden">
            <span className="text-xs text-foreground/80 font-mono truncate block">
              {MOCK_REFERRAL_LINK}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => handleCopy(MOCK_REFERRAL_LINK, "link")}
            className="flex-shrink-0 p-2.5 rounded-xl bg-neon-green/10 border border-neon-green/30 hover:bg-neon-green/20 transition-colors cursor-pointer"
          >
            {copied === "link" ? (
              <Check className="size-4 text-neon-green" />
            ) : (
              <Copy className="size-4 text-neon-green" />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Promo code */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-2xl bg-card/60 border border-border/40 backdrop-blur-xl p-4 space-y-3"
      >
        <span className="font-display font-bold text-xs tracking-[0.15em] text-muted-foreground uppercase">
          Promo Code
        </span>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl bg-secondary/60 border border-neon-purple/20 px-4 py-3 text-center">
            <span className="font-display font-bold text-xl tracking-[0.3em] text-neon-purple">
              {MOCK_PROMO_CODE}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => handleCopy(MOCK_PROMO_CODE, "code")}
            className="flex-shrink-0 p-2.5 rounded-xl bg-neon-purple/10 border border-neon-purple/30 hover:bg-neon-purple/20 transition-colors cursor-pointer"
          >
            {copied === "code" ? (
              <Check className="size-4 text-neon-purple" />
            ) : (
              <Copy className="size-4 text-neon-purple" />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Share buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-3"
      >
        <span className="font-display font-bold text-xs tracking-[0.15em] text-muted-foreground uppercase">
          Share via
        </span>
        <div className="grid grid-cols-3 gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleShare("telegram")}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/30 hover:bg-[#229ED9]/20 transition-colors cursor-pointer"
          >
            <Send className="size-5 text-[#229ED9]" />
            <span className="text-[10px] font-display tracking-wider text-[#229ED9]">TELEGRAM</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleShare("whatsapp")}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors cursor-pointer"
          >
            <MessageCircle className="size-5 text-[#25D366]" />
            <span className="text-[10px] font-display tracking-wider text-[#25D366]">WHATSAPP</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleShare("twitter")}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-foreground/5 border border-foreground/20 hover:bg-foreground/10 transition-colors cursor-pointer"
          >
            <Share2 className="size-5 text-foreground" />
            <span className="text-[10px] font-display tracking-wider text-foreground">TWITTER</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Editable message */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="space-y-2"
      >
        <span className="font-display font-bold text-xs tracking-[0.15em] text-muted-foreground uppercase">
          Message Template
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full rounded-xl bg-secondary/60 border border-border/30 px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-neon-green/50"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMessage(DEFAULT_MESSAGE)}
          className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          Reset to default
        </Button>
      </motion.div>
    </div>
  );
}
