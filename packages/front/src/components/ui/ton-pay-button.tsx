import { TonPayButton as ReactTonPayButton, useTonPay } from "@ton-pay/ui-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback, useState } from "react";

export type PayButtonPayload = {
  amount: number
  disabled: boolean
  network: "mainnet" | "testnet"
}
export default function TonPayButton(payload: PayButtonPayload) {
  const { pay } = useTonPay();
  const getTxPayload = useAction(api.deposits.tonPay.payload.get)

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await pay(async (senderAddr: string) => {
        const { message, reference, bodyBase64Hash } = await getTxPayload({
          amount: payload.amount,
          senderAddr,
        })
        return { message, reference, bodyBase64Hash };
      });
      // Show success message...
    } catch (err: any) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [payload.amount])

  return (
    <div>
      <ReactTonPayButton
        preset='gradient'
        text={`DEPOSIT ${payload.amount} TON`}
        width='100%'
        variant='long'
        handlePay={handlePayment}
        isLoading={isLoading}
        network={payload.network}
        amount={payload.amount}
        disabled={payload.disabled}
      />
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}