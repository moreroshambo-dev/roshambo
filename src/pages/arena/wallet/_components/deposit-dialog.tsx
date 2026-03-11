import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useTelegram } from "@/components/providers/telegram.tsx";
import { ConvexError } from "convex/values";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
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
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";

type TokenType = "TON" | "USDT" | "NOT" | "DOGS";

/** Step in the deposit flow */
type DepositStep = "select_token" | "enter_amount" | "processing" | "result";

type DepositResult = {
  status: "confirmed" | "failed" | "pending" | "pending_review";
  txHash: string;
  creditedTokens: number;
  depositId: string;
};

const TOKEN_ICONS: Record<TokenType, string> = {
  TON: "💎",
  USDT: "💵",
  NOT: "🔔",
  DOGS: "🐕",
};

export default function DepositDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { telegramId, hapticImpact, hapticNotification } = useTelegram();
  const tokenInfo = useQuery(api.deposits.getTokenInfo, {});
  const initiateDeposit = useMutation(api.deposits.initiateDeposit);

  const [step, setStep] = useState<DepositStep>("select_token");
  const [selectedToken, setSelectedToken] = useState<TokenType | null>(null);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<DepositResult | null>(null);

  const resetFlow = () => {
    setStep("select_token");
    setSelectedToken(null);
    setAmount("");
    setResult(null);
    setIsSubmitting(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetFlow();
    onOpenChange(open);
  };

  const handleSelectToken = (token: TokenType) => {
    hapticImpact("light");
    setSelectedToken(token);
    setStep("enter_amount");
  };

  const selectedInfo = tokenInfo?.tokens.find((t) => t.symbol === selectedToken);
  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0 && selectedInfo
    ? parsedAmount >= selectedInfo.min
    : false;
  const previewTokens = isValidAmount && selectedInfo
    ? Math.floor(parsedAmount * selectedInfo.rate)
    : 0;

  const handleDeposit = async () => {
    if (!telegramId || !selectedToken || !isValidAmount) return;
    hapticImpact("heavy");
    setIsSubmitting(true);
    setStep("processing");

    try {
      const res = await initiateDeposit({
        telegramId,
        tokenType: selectedToken,
        displayAmount: parsedAmount,
      });

      // Wait a moment then poll for result
      // The mock blockchain confirms after 3-8s, we poll the deposit
      setResult({
        status: "pending",
        txHash: res.txHash,
        creditedTokens: previewTokens,
        depositId: res.depositId,
      });
      setStep("result");
      hapticNotification("success");
      toast.success("Deposit initiated — awaiting blockchain confirmation");
    } catch (error) {
      setStep("result");
      const msg = error instanceof ConvexError
        ? (error.data as { message: string }).message
        : "Failed to initiate deposit";
      setResult({
        status: "failed",
        txHash: "",
        creditedTokens: 0,
        depositId: "",
      });
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
            {step === "select_token" && "Choose the token you want to deposit"}
            {step === "enter_amount" && `Enter the amount of ${selectedToken} to deposit`}
            {step === "processing" && "Processing your deposit..."}
            {step === "result" && "Deposit result"}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ─── Step 1: Token selection ─── */}
          {step === "select_token" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-2 py-2"
            >
              {tokenInfo?.tokens.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => handleSelectToken(token.symbol as TokenType)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border/30 hover:border-neon-blue/40 hover:bg-neon-blue/5 transition-all cursor-pointer"
                >
                  <span className="text-2xl">{TOKEN_ICONS[token.symbol as TokenType]}</span>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-display font-bold text-foreground tracking-wider">
                      {token.symbol}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{token.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-neon-gold font-display font-bold">
                      1 = {token.rate} tokens
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      min: {token.min} {token.symbol}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              ))}
            </motion.div>
          )}

          {/* ─── Step 2: Enter amount ─── */}
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
                <span className="text-2xl">{TOKEN_ICONS[selectedToken!]}</span>
                <div>
                  <div className="text-sm font-display font-bold tracking-wider">
                    {selectedInfo.symbol}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{selectedInfo.name}</div>
                </div>
                <button
                  onClick={() => { setStep("select_token"); setAmount(""); }}
                  className="ml-auto text-xs text-neon-blue hover:underline font-display tracking-wider cursor-pointer"
                >
                  CHANGE
                </button>
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
              {isValidAmount && (
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
                    Rate: 1 {selectedInfo.symbol} = {selectedInfo.rate} tokens
                  </div>
                </motion.div>
              )}

              {/* Deposit button */}
              <Button
                disabled={!isValidAmount || isSubmitting}
                onClick={handleDeposit}
                className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white font-display tracking-wider text-sm py-5 shadow-lg shadow-neon-blue/20"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <ArrowDownToLine className="size-4 mr-2" />
                )}
                DEPOSIT {isValidAmount ? `${parsedAmount} ${selectedInfo.symbol}` : ""}
              </Button>
            </motion.div>
          )}

          {/* ─── Step 3: Processing ─── */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center py-8 gap-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-neon-blue/10 border-2 border-neon-blue/30 flex items-center justify-center">
                  <Loader2 className="size-8 text-neon-blue animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full bg-neon-blue/5 animate-ping" />
              </div>
              <div className="text-center">
                <h3 className="font-display font-bold text-sm tracking-[0.15em] text-foreground">
                  PROCESSING
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Waiting for blockchain confirmation...
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── Step 4: Result ─── */}
          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center py-6 gap-4"
            >
              <ResultIcon status={result.status} />

              <div className="text-center">
                <h3 className="font-display font-bold text-sm tracking-[0.15em] text-foreground uppercase">
                  {result.status === "pending" && "Deposit Pending"}
                  {result.status === "confirmed" && "Deposit Confirmed"}
                  {result.status === "failed" && "Deposit Failed"}
                  {result.status === "pending_review" && "Under Review"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                  {result.status === "pending" &&
                    "Your deposit is being confirmed on the blockchain. Tokens will be credited shortly."}
                  {result.status === "confirmed" &&
                    `${result.creditedTokens.toLocaleString()} tokens credited to your balance!`}
                  {result.status === "failed" &&
                    "The transaction could not be completed. Please try again."}
                  {result.status === "pending_review" &&
                    "This deposit is being reviewed by our security system."}
                </p>
              </div>

              {result.txHash && (
                <div className="w-full rounded-lg bg-background/40 border border-border/30 p-2.5">
                  <div className="text-[9px] text-muted-foreground font-display tracking-wider mb-0.5">
                    TX HASH
                  </div>
                  <div className="text-[10px] font-mono text-foreground/70 break-all">
                    {result.txHash}
                  </div>
                </div>
              )}

              <Button
                className="w-full font-display tracking-wider text-sm"
                onClick={() => handleClose(false)}
              >
                {result.status === "failed" ? "TRY AGAIN" : "DONE"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function ResultIcon({ status }: { status: string }) {
  if (status === "confirmed") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-16 h-16 rounded-full bg-neon-green/10 border-2 border-neon-green/30 flex items-center justify-center"
      >
        <CheckCircle2 className="size-8 text-neon-green" />
      </motion.div>
    );
  }
  if (status === "failed") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center"
      >
        <XCircle className="size-8 text-destructive" />
      </motion.div>
    );
  }
  if (status === "pending_review") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-16 h-16 rounded-full bg-neon-gold/10 border-2 border-neon-gold/30 flex items-center justify-center"
      >
        <ShieldAlert className="size-8 text-neon-gold" />
      </motion.div>
    );
  }
  // pending
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="w-16 h-16 rounded-full bg-neon-blue/10 border-2 border-neon-blue/30 flex items-center justify-center"
    >
      <Clock className="size-8 text-neon-blue" />
    </motion.div>
  );
}
