import { AlertTriangle, Clock } from "lucide-react";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { useUpgradeModal } from "@/components/UpgradeModal";

export function TrialBanner() {
  const { plan, daysLeft, isOwner, loading } = useAccountStatus();
  const { open } = useUpgradeModal();

  if (loading) return null;
  if (isOwner) return null;
  if (plan !== "trial") return null;
  if (daysLeft <= 0) return null;

  const urgent = daysLeft <= 3;

  if (urgent) {
    return (
      <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-red-500/[0.12] border-b border-red-500/25">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <span className="text-[13px] text-red-200 font-medium truncate">
            <span className="font-bold text-red-300">
              {daysLeft} {daysLeft === 1 ? "day" : "days"}
            </span>{" "}
            left — trial ending soon
          </span>
        </div>
        <button
          onClick={open}
          className="text-[13px] font-semibold px-3 py-1.5 rounded-md text-white bg-red-500 hover:bg-red-600 transition-colors shrink-0"
        >
          Upgrade Now
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-amber-500/[0.08] border-b border-amber-500/20">
      <div className="flex items-center gap-2 min-w-0">
        <Clock className="h-4 w-4 text-amber-400 shrink-0" />
        <span className="text-[13px] text-white/80 font-medium truncate">
          {daysLeft} {daysLeft === 1 ? "day" : "days"} left on your free trial
        </span>
      </div>
      <button
        onClick={open}
        className="text-[13px] font-semibold px-3 py-1.5 rounded-md text-white bg-amber-500 hover:bg-amber-600 transition-colors shrink-0"
      >
        Upgrade Plan →
      </button>
    </div>
  );
}
