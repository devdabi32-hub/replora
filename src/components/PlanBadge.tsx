import { useAccountStatus } from "@/hooks/useAccountStatus";
import { useUpgradeModal } from "@/components/UpgradeModal";

export function PlanBadge() {
  const { plan, daysLeft, isOwner, loading } = useAccountStatus();
  const { open } = useUpgradeModal();

  if (loading) return null;

  let label = "";
  let cls = "";
  let clickable = true;

  if (isOwner) {
    label = "👑 Owner";
    cls = "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30";
    clickable = false;
  } else if (plan === "trial") {
    const urgent = daysLeft <= 3;
    label = `Trial · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left${urgent ? " ⚠️" : ""}`;
    cls = urgent
      ? "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30"
      : "bg-white/[0.06] text-white/70 border-white/10";
  } else if (plan === "starter") {
    label = "Starter";
    cls = "bg-[#0084ff]/15 text-[#0084ff] border-[#0084ff]/30";
  } else if (plan === "growth") {
    label = "Growth";
    cls = "bg-[#00c853]/15 text-[#00c853] border-[#00c853]/30";
  } else if (plan === "agency") {
    label = "Agency";
    cls = "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30";
  } else {
    label = plan;
    cls = "bg-white/[0.06] text-white/70 border-white/10";
  }

  const inner = (
    <span className={`inline-flex w-full justify-center items-center px-3 py-1.5 rounded-full border text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );

  if (!clickable) return <div className="px-2">{inner}</div>;
  return (
    <button onClick={open} className="w-full px-2 hover:opacity-90 transition-opacity">
      {inner}
    </button>
  );
}