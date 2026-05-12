import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const OWNER_EMAIL = "devdabi32@gmail.com";

export type PlanName = "trial" | "starter" | "growth" | "agency" | string;
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
  refresh: () => Promise<void>;
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
  refresh: async () => {},
};

export function useAccountStatus(): AccountStatus {
  const [state, setState] = useState<AccountStatus>(DEFAULT);

  const load = async () => {
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
    const agencyId = (userRow?.agency_id as string | undefined) ?? null;

    let plan: PlanName = "trial";
    let plan_status: PlanStatus = "trial";
    let trial_ends_at: string | null = null;
    let is_owner = false;

    if (agencyId) {
      const { data: agency } = await supabase
        .from("agencies")
        .select("plan, plan_status, trial_ends_at, is_owner")
        .eq("id", agencyId)
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

    setState((prev) => ({
      ...prev,
      loading: false,
      agencyId,
      email,
      plan,
      plan_status,
      trial_ends_at,
      is_owner,
      isOwner,
      isExpired,
      daysLeft,
      refresh: load,
    }));
  };

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { load(); });
    return () => sub.subscription.unsubscribe();
  }, []);

  return state;
}