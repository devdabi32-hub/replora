import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const OWNER_EMAIL = "devdabi32@gmail.com";

export type PlanName = "trial" | "starter" | "pro" | "growth" | "agency" | string;
export type PlanStatus = "active" | "trialing" | "trial" | "expired" | string;

export type AccountStatus = {
  loading: boolean;
  agencyId: string | null;
  email: string;
  plan: PlanName;
  plan_status: PlanStatus;
  trial_ends_at: string | null;
  is_owner: boolean;
  isOwner: boolean;
  isExpired: boolean;
  daysLeft: number;
  refresh: () => void;
};

const DEFAULT: AccountStatus = {
  loading: true,
  agencyId: null,
  email: "",
  plan: "trial",
  plan_status: "trial",
  trial_ends_at: null,
  is_owner: false,
  isOwner: false,
  isExpired: false,
  daysLeft: 0,
  refresh: () => {},
};

export function useAccountStatus(): AccountStatus {
  const [state, setState] = useState<AccountStatus>(DEFAULT);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setState({ ...DEFAULT, loading: false });
      return;
    }
    const email = user.email ?? "";
    const { data: userRow } = await supabase
      .from("users")
      .select("agency_id")
      .eq("id", user.id)
      .maybeSingle();
    const foundAgencyId = (userRow?.agency_id as string | undefined) ?? null;
    setAgencyId(foundAgencyId);
    let plan: PlanName = "trial";
    let plan_status: PlanStatus = "trial";
    let trial_ends_at: string | null = null;
    let is_owner = false;
    if (foundAgencyId) {
      const { data: agency } = await supabase
        .from("agencies")
        .select("plan, plan_status, trial_ends_at, is_owner")
        .eq("id", foundAgencyId)
        .maybeSingle();
      if (agency) {
        plan = (agency.plan as string) ?? "trial";
        plan_status = (agency.plan_status as string) ?? "trial";
        trial_ends_at = (agency.trial_ends_at as string) ?? null;
        is_owner = agency.is_owner === true;
      }
    }
    const isOwner = is_owner === true || email === OWNER_EMAIL;
    const daysLeft = trial_ends_at
      ? Math.max(0, Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / 86400000))
      : 0;
    const isExpired = isOwner ? false : plan_status === "expired";
    setState({
      loading: false,
      agencyId: foundAgencyId,
      email,
      plan,
      plan_status,
      trial_ends_at,
      is_owner,
      isOwner,
      isExpired,
      daysLeft,
      refresh: load,
    });
  }, []);

  useEffect(() => {
    load();

    // Re-fetch when user returns to tab (e.g. after Razorpay payment)
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    // Poll every 30 seconds as reliable backup
    const interval = setInterval(() => load(), 30000);

    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
      authSub.subscription.unsubscribe();
    };
  }, [load]);

  useEffect(() => {
    if (!agencyId) return;
    const channel = supabase
      .channel(`agency-plan-${agencyId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "agencies",
        filter: `id=eq.${agencyId}`,
      }, (payload) => {
        console.log("Realtime plan update:", payload.new);
        load();
      })
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });
    return () => { supabase.removeChannel(channel); };
  }, [agencyId, load]);

  return state;
}
