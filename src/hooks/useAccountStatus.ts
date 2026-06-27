import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { OWNER_EMAIL, MS_PER_DAY } from "@/lib/constants";

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
  refresh: () => { },
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
      .select("agency_id, agencies(plan, plan_status, trial_ends_at, is_owner)")
      .eq("id", user.id)
      .maybeSingle();

    const foundAgencyId = (userRow?.agency_id as string | undefined) ?? null;
    setAgencyId(foundAgencyId);

    let plan: PlanName = "trial";
    let plan_status: PlanStatus = "trial";
    let trial_ends_at: string | null = null;
    let is_owner = false;

    type AgencyRow = { plan: string; plan_status: string; trial_ends_at: string | null; is_owner: boolean };
    const agencyRow = userRow?.agencies as AgencyRow | null | undefined;
    if (agencyRow) {
      plan = agencyRow.plan ?? "trial";
      plan_status = agencyRow.plan_status ?? "trial";
      trial_ends_at = agencyRow.trial_ends_at ?? null;
      is_owner = agencyRow.is_owner === true;
    }

    const isOwner = is_owner === true || email === OWNER_EMAIL;
    const daysLeft = trial_ends_at
      ? Math.max(0, Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / MS_PER_DAY))
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

  // ── Initial load + auth state listener ──
  useEffect(() => {
    load();
    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => {
      authSub.subscription.unsubscribe();
    };
  }, [load]);

  // ── Supabase Realtime — re-fetch when agency plan changes ──
  useEffect(() => {
    if (!agencyId) return;

    const channel = supabase
      .channel(`agency-plan-${agencyId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agencies",
          filter: `id=eq.${agencyId}`,
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId, load]);

  return state;
}
