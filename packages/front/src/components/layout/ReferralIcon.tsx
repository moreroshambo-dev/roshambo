import { Gift } from "lucide-react";
import { Link } from "react-router-dom";

export default function ReferralIcon() {
  return (
    <Link
      to="/referral"
      className="p-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 hover:bg-neon-green/20 transition-colors cursor-pointer"
      title="Referral Program"
    >
      <Gift className="size-3.5 text-neon-green" />
    </Link>
  );
}