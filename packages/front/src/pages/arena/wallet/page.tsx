import { useState, useEffect, useCallback } from "react";
import { useTonConnectUI, useTonWallet, useTonAddress } from "@tonconnect/ui-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useTelegram } from "@/components/providers/telegram.tsx";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Wallet,
  Link2,
  Unlink,
  Copy,
  CheckCircle2,
  ExternalLink,
  Coins,
  ShieldCheck,
  ArrowDownToLine,
  History,
} from "lucide-react";
import DepositDialog from "./_components/deposit-dialog.tsx";
import DepositHistory from "./_components/deposit-history.tsx";

/** Truncate TON address for display: EQBx…4kF2 */
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function WalletPage() {
  const { hapticImpact, hapticNotification } = useTelegram();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const rawAddress = useTonAddress(false);
  const friendlyAddress = useTonAddress(true);

  const user = useQuery(api.users.getCurrentUser);
  const balance = useQuery(api.users.getBalance);
  const linkWallet = useMutation(api.users.linkWallet);
  const unlinkWallet = useMutation(api.users.unlinkWallet);

  const [depositOpen, setDepositOpen] = useState(false);

  // When wallet connects, sync the address to the backend
  const syncWallet = useCallback(async () => {
    if (!friendlyAddress) return;
    try {
      await linkWallet({ walletAddress: friendlyAddress });
      hapticNotification("success");
      toast.success("Wallet connected successfully");
    } catch {
      toast.error("Failed to save wallet address");
    }
  }, [friendlyAddress, linkWallet, hapticNotification]);

  useEffect(() => {
    if (wallet && friendlyAddress) {
      if (user && user.walletAddress !== friendlyAddress) {
        syncWallet();
      }
    }
  }, [wallet, friendlyAddress, user, syncWallet]);

  const handleConnect = () => {
    hapticImpact("medium");
    tonConnectUI.openModal();
  };

  const handleDisconnect = async () => {
    hapticImpact("heavy");
    try {
      await tonConnectUI.disconnect();
      await unlinkWallet();
      hapticNotification("success");
      toast.success("Wallet disconnected");
    } catch {
      toast.error("Failed to disconnect wallet");
    }
  };

  const copyAddress = () => {
    if (friendlyAddress) {
      navigator.clipboard.writeText(friendlyAddress);
      hapticNotification("success");
      toast.success("Address copied to clipboard");
    }
  };

  const isConnected = !!wallet;

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  const availableBalance = balance?.available ?? 0
  const lockedBalance = balance?.locked ?? 0;

  return (
    <div className="max-w-lg mx-auto px-3 py-5 space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 mb-1">
          <Wallet className="size-5 text-neon-blue" />
          <h1 className="font-display font-bold text-lg tracking-[0.15em] text-foreground uppercase">
            Wallet
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Connect your TON wallet to deposit crypto
        </p>
      </motion.div>

      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl bg-gradient-to-br from-neon-purple/10 via-card/80 to-neon-blue/10 border border-border/40 backdrop-blur-xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Coins className="size-4 text-neon-gold" />
          <span className="text-xs text-muted-foreground font-display tracking-wider uppercase">
            Game Balance
          </span>
        </div>
        <div className="font-display font-bold text-3xl text-foreground tracking-wider">
          {availableBalance.toLocaleString()}
          <span className="text-sm text-muted-foreground ml-2">tokens</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Locked: {lockedBalance.toLocaleString()}
        </div>
        {isConnected && (
          <Button
            size="sm"
            className="mt-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-display tracking-wider text-xs shadow-md shadow-neon-blue/15"
            onClick={() => {
              hapticImpact("medium");
              setDepositOpen(true);
            }}
          >
            <ArrowDownToLine className="size-3.5 mr-1.5" />
            DEPOSIT CRYPTO
          </Button>
        )}
      </motion.div>

      {/* Wallet connection card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card/60 border border-border/40 backdrop-blur-xl overflow-hidden"
      >
        {isConnected ? (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="size-4 text-neon-green" />
              <span className="text-xs font-display tracking-wider text-neon-green uppercase font-bold">
                Connected
              </span>
            </div>

            {/* Wallet info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-neon-blue/15 border border-neon-blue/20 flex items-center justify-center">
                <Wallet className="size-5 text-neon-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-display font-bold text-foreground tracking-wider">
                  {wallet?.device?.appName ?? "TON Wallet"}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-muted-foreground font-mono truncate">
                    {truncateAddress(friendlyAddress || rawAddress || "")}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="text-muted-foreground hover:text-neon-blue transition-colors cursor-pointer"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                className="bg-neon-blue/15 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/25 font-display tracking-wider text-xs"
                onClick={() => {
                  hapticImpact("medium");
                  setDepositOpen(true);
                }}
              >
                <ArrowDownToLine className="size-3.5 mr-1.5" />
                DEPOSIT
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 font-display tracking-wider text-xs"
                onClick={handleDisconnect}
              >
                <Unlink className="size-3.5 mr-1.5" />
                DISCONNECT
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center mx-auto mb-4">
              <Link2 className="size-7 text-neon-blue" />
            </div>
            <h3 className="font-display font-bold text-sm tracking-[0.15em] text-foreground mb-1.5">
              CONNECT WALLET
            </h3>
            <p className="text-xs text-muted-foreground mb-5 max-w-[260px] mx-auto">
              Link your TON wallet to deposit crypto and top up your game balance
            </p>
            <Button
              className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white font-display tracking-wider text-sm py-5 shadow-lg shadow-neon-blue/20"
              onClick={handleConnect}
            >
              <Wallet className="size-4 mr-2" />
              CONNECT TON WALLET
            </Button>
          </div>
        )}
      </motion.div>

      {/* Deposit History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <History className="size-4 text-neon-purple" />
          <h2 className="font-display font-bold text-sm tracking-[0.2em] text-neon-purple uppercase">
            Deposit History
          </h2>
        </div>
        <DepositHistory />
      </motion.div>

      {/* Info cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <InfoRow
          icon={<ShieldCheck className="size-4 text-neon-green" />}
          title="Secure Connection"
          description="TonConnect ensures your keys never leave your wallet"
        />
        <InfoRow
          icon={<Coins className="size-4 text-neon-gold" />}
          title="TON & Jettons"
          description="Deposit TON, USDT, NOT, or DOGS tokens"
        />
        <InfoRow
          icon={<ExternalLink className="size-4 text-neon-purple" />}
          title="Anti-Fraud Protection"
          description="Every deposit is verified by our security system"
        />
      </motion.div>

      {/* Deposit dialog */}
      <DepositDialog open={depositOpen} onOpenChange={setDepositOpen} />
    </div>
  );
}

function InfoRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-card/40 border border-border/30 p-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-xs font-display font-bold text-foreground tracking-wider">
          {title}
        </div>
        <div className="text-[10px] text-muted-foreground leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
}
