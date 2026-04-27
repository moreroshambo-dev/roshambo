import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useTelegram } from "@/components/providers/telegram.tsx";
import { ConvexError } from "convex/values";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.tsx";
import {
  ArrowDownToLine,
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import TonPayButton from "@/components/ui/ton-pay-button";

type TokenType = "TON" | "USDT";

/** Step in the deposit flow */
type DepositStep = "enter_amount" | "enter_amount" | "processing" | "result";

type DepositResult = {
  status: "confirmed" | "failed" | "pending" | "pending_review";
  txHash?: string;
  creditedTokens: number;
  depositId: string;
  appliedRate: number;
  tokenType: TokenType;
  amount: number;
  depositAddress: string;
  commentCode: string;
  tonPayload?: string;
};

export default function DepositDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { hapticImpact, hapticNotification } = useTelegram();
  const tokenInfo = useQuery(api.deposits.tonPay.index.getTokenInfo, {});

  const [step, setStep] = useState<DepositStep>("enter_amount");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetFlow = () => {
    setStep("enter_amount");
    setAmount("");
    setIsSubmitting(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetFlow();
    onOpenChange(open);
  };

  const selectedInfo = tokenInfo?.tokens.find((t) => t.symbol === 'TON');
  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0 && selectedInfo
    ? parsedAmount >= selectedInfo.min
    : false;
  const previewTokens = isValidAmount && selectedInfo
    ? Math.floor(parsedAmount * selectedInfo.rate)
    : 0;

  const handleDeposit = async () => {
    if (!isValidAmount) return;
    hapticImpact("heavy");
    setIsSubmitting(true);
    setStep("processing");

    try {
      // Wait a moment then poll for result
      // The mock blockchain confirms after 3-8s, we poll the deposit
      
      setStep("result");
      hapticNotification("success");
      toast.success("Deposit initiated — awaiting blockchain confirmation");
    } catch (error) {
      setStep("result");
      const msg = error instanceof ConvexError
        ? (error.data as { message: string }).message
        : "Failed to initiate deposit";

      hapticNotification("error");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border/40 max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-[0.15em] text-sm uppercase flex items-center gap-2">
            <ArrowDownToLine className="size-4 text-neon-blue" />
            Deposit Crypto
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {step === "enter_amount" && `Enter the amount of ${'selectedToken'} to deposit`}
            {step === "processing" && "Processing your deposit..."}
            {step === "result" && "Deposit result"}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ─── Step 1: Enter amount ─── */}
          {step === "enter_amount" && selectedInfo && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 py-2"
            >
              {/* Token header */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/30">
                <span className="text-2xl">TON 💎</span>
                <div>
                  <div className="text-sm font-display font-bold tracking-wider">
                    {selectedInfo.symbol}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{selectedInfo.name}</div>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider block mb-1.5">
                  AMOUNT ({selectedInfo.symbol})
                </label>
                <Input
                  type="number"
                  placeholder={`Min ${selectedInfo.min}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={selectedInfo.min}
                  step="any"
                  className="bg-background/60 border-border/40 font-mono text-lg"
                  autoFocus
                />
                {amount && !isValidAmount && (
                  <p className="text-[10px] text-destructive mt-1">
                    Minimum deposit is {selectedInfo.min} {selectedInfo.symbol}
                  </p>
                )}
              </div>

              {/* Preview */}
              {(
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl bg-neon-gold/5 border border-neon-gold/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-display tracking-wider">
                      YOU RECEIVE
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Coins className="size-3.5 text-neon-gold" />
                      <span className="font-display font-bold text-lg text-neon-gold tracking-wider">
                        {previewTokens.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">tokens</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1 text-right">
                    Rate: 1 {selectedInfo.symbol} = {selectedInfo.rate.toFixed(4)} tokens
                  </div>
                </motion.div>
              )}

              <TonPayButton
                disabled={!isValidAmount || isSubmitting}
                network="testnet"
                amount={parsedAmount}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
