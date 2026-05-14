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
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setState({ ...DEFAULT, loading: false });
      return;
    }

    const email = user.email ?? "";
    console.log("[useAccountStatus] Loading for:", email);

    // Primary: resolve agency_id via users table
    const { data: userRow } = await supabase
      .from("users")
      .select("agency_id")
      .eq("id", user.id)
      .maybeSingle();

    let foundAgencyId = (userRow?.agency_id as string | undefined) ?? null;
    console.log("[useAccountStatus] users.agency_id:", foundAgencyId);

    let plan: PlanName = "trial";
    let plan_status: PlanStatus = "trial";
    let trial_ends_at: string | null = null;
    let is_owner = false;
    let agencyEmail = email;

    if (foundAgencyId) {
      const { data: agency } = await supabase
        .from("agencies")
        .select("plan, plan_status, trial_ends_at, is_owner, email")
        .eq("id", foundAgencyId)
        .maybeSingle();

      console.log("[useAccountStatus] agency row:", agency);
      if (agency) {
        plan = (agency.plan as string) ?? "trial";
        plan_status = (agency.plan_status as string) ?? "trial";
        trial_ends_at = (agency.trial_ends_at as string) ?? null;
        is_owner = agency.is_owner === true;
        agencyEmail = (agency.email as string) ?? email;
      }
    } else {
      // Fallback: users table had no row — try to find agency directly by email
      console.log("[useAccountStatus] No users row found, trying email fallback:", email);
      const { data: agencyByEmail } = await supabase
        .from("agencies")
        .select("id, plan, plan_status, trial_ends_at, is_owner, email")
        .eq("email", email)
        .maybeSingle();

      console.log("[useAccountStatus] agency by email:", agencyByEmail);
      if (agencyByEmail) {
        foundAgencyId = agencyByEmail.id as string;
        plan = (agencyByEmail.plan as string) ?? "trial";
        plan_status = (agencyByEmail.plan_status as string) ?? "trial";
        trial_ends_at = (agencyByEmail.trial_ends_at as string) ?? null;
        is_owner = agencyByEmail.is_owner === true;
        agencyEmail = (agencyByEmail.email as string) ?? email;
      }
    }

    setAgencyId(foundAgencyId);

    const isOwner = is_owner === true || email === OWNER_EMAIL || agencyEmail === OWNER_EMAIL;

    // daysLeft only meaningful for trial plan
    const daysLeft =
      plan === "trial" && trial_ends_at
        ? Math.max(0, Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / 86400000))
        : 0;

    // isExpired = true ONLY when plan_status = 'expired' AND plan = 'trial'
    // Paid plans (starter/pro/growth/agency) with plan_status = 'active' are NEVER expired
    const isExpired = isOwner
      ? false
      : plan_status === "expired" && plan === "trial";

    console.log("[useAccountStatus] Final state:", { plan, plan_status, isOwner, isExpired, daysLeft, foundAgencyId });

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

  // Initial load + auth state listener
  useEffect(() => {
    load();
    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => {
      authSub.subscription.unsubscribe();
    };
  }, [load]);

  // Realtime: re-fetch immediately when agency row is updated in DB
  useEffect(() => {
    if (!agencyId) return;

    const channel = supabase
      .channel(`agency-status-${agencyId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agencies",
          filter: `id=eq.${agencyId}`,
        },
        (payload) => {
          console.log("[useAccountStatus] Realtime UPDATE received:", payload.new);
          load();
        }
      )
      .subscribe((status) => {
        console.log("[useAccountStatus] Realtime channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId, load]);

  return state;
}
