import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { TeamInviteModal } from "@/components/TeamInviteModal";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { useUpgradeModal } from "@/components/UpgradeModal";
import {
    Users, UserPlus, Loader2, Crown, Headphones,
    Clock, CheckCircle2, Trash2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/team")({
    head: () => ({ meta: [{ title: "Team — Replora" }] }),
    component: () => (
        <AppLayout>
            <TeamPage />
        </AppLayout>
    ),
});

interface TeamMember {
    id: string;
    full_name: string | null;
    role: string;
    created_at: string;
    email?: string;
}

interface PendingInvite {
    id: string;
    email: string;
    role: string;
    created_at: string;
    invite_code: string;
}

function TeamPage() {
    const navigate = useNavigate();
    const { isExpired, plan } = useAccountStatus();
    const { open: openUpgrade } = useUpgradeModal();

    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invites, setInvites] = useState<PendingInvite[]>([]);
    const [agencyId, setAgencyId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [updatingRole, setUpdatingRole] = useState<string | null>(null);

    // Team features require Starter plan or above
    const canUseTeam = !isExpired && plan !== "trial";

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate({ to: "/login" }); return; }
            setCurrentUserId(user.id);

            const { data: userRow } = await supabase
                .from("users")
                .select("agency_id")
                .eq("id", user.id)
                .maybeSingle();

            if (!userRow?.agency_id) { setLoading(false); return; }
            setAgencyId(userRow.agency_id);

            await Promise.all([
                loadMembers(userRow.agency_id),
                loadInvites(userRow.agency_id),
            ]);
            setLoading(false);
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    async function loadMembers(aid: string) {
        const { data } = await supabase
            .from("users")
            .select("id, full_name, role, created_at")
            .eq("agency_id", aid)
            .order("created_at", { ascending: true });
        setMembers((data ?? []) as TeamMember[]);
    }

    async function loadInvites(aid: string) {
        const { data } = await supabase
            .from("team_invites")
            .select("id, email, role, created_at, invite_code")
            .eq("agency_id", aid)
            .eq("status", "pending")
            .order("created_at", { ascending: false });
        setInvites((data ?? []) as PendingInvite[]);
    }

    async function changeRole(memberId: string, newRole: "admin" | "agent") {
        setUpdatingRole(memberId);
        const { error } = await supabase
            .from("users")
            .update({ role: newRole })
            .eq("id", memberId);
        if (error) {
            toast.error("Failed to update role");
        } else {
            toast.success("Role updated");
            setMembers((prev) =>
                prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m)
            );
        }
        setUpdatingRole(null);
    }

    async function revokeInvite(inviteId: string) {
        const { error } = await supabase
            .from("team_invites")
            .delete()
            .eq("id", inviteId);
        if (error) {
            toast.error("Failed to revoke invite");
        } else {
            toast.success("Invite revoked");
            setInvites((prev) => prev.filter((i) => i.id !== inviteId));
        }
    }

    const SEAT_PRICE = 499;

    return (
        <div className="max-w-3xl mx-auto space-y-8 p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Team</h1>
                    <p className="text-sm text-white/40 mt-1">
                        Manage team members and assign conversations.
                    </p>
                </div>
                <button
                    onClick={() => canUseTeam ? setShowInvite(true) : openUpgrade()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0084ff] text-white text-sm font-medium hover:bg-[#0084ff]/90 transition-colors flex-shrink-0"
                >
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                </button>
            </div>

            {/* Seat billing info */}
            {canUseTeam && (
                <div className="rounded-xl bg-[#0084ff]/10 border border-[#0084ff]/20 px-4 py-3 flex items-center gap-3">
                    <Users className="h-4 w-4 text-[#0084ff] flex-shrink-0" />
                    <p className="text-sm text-white/70">
                        Each additional agent seat is{" "}
                        <span className="text-white font-medium">₹{SEAT_PRICE}/month</span>.
                        Admins are free.
                    </p>
                </div>
            )}

            {/* Upgrade prompt for trial users */}
            {!canUseTeam && (
                <div className="rounded-xl bg-white/[0.03] border border-white/10 px-5 py-4 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-white">Team inbox is a paid feature</p>
                        <p className="text-xs text-white/40 mt-0.5">Upgrade to Starter or above to invite team members.</p>
                    </div>
                    <button
                        onClick={openUpgrade}
                        className="flex-shrink-0 px-4 py-2 rounded-lg bg-[#0084ff] text-white text-sm font-medium hover:bg-[#0084ff]/90 transition-colors"
                    >
                        Upgrade
                    </button>
                </div>
            )}

            {/* Members list */}
            <section>
                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                    Active Members ({members.length})
                </h2>
                <div className="rounded-xl border border-white/10 overflow-hidden divide-y divide-white/[0.06]">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-5 w-5 animate-spin text-white/30" />
                        </div>
                    ) : members.length === 0 ? (
                        <div className="py-10 text-center text-sm text-white/30">No team members yet</div>
                    ) : (
                        members.map((m) => {
                            const isMe = m.id === currentUserId;
                            const initials = (m.full_name ?? "?").slice(0, 2).toUpperCase();
                            return (
                                <div key={m.id} className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                    {/* Avatar */}
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                        {initials}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white truncate">
                                                {m.full_name ?? "Unnamed"}
                                            </span>
                                            {isMe && (
                                                <span className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full">you</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-white/30 mt-0.5">
                                            Joined {new Date(m.created_at).toLocaleDateString("en-IN")}
                                        </p>
                                    </div>
                                    {/* Role selector */}
                                    <div className="flex items-center gap-2">
                                        {updatingRole === m.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-white/30" />
                                        ) : (
                                            <select
                                                value={m.role}
                                                disabled={isMe}
                                                onChange={(e) => changeRole(m.id, e.target.value as "admin" | "agent")}
                                                className={`text-xs rounded-lg px-2.5 py-1.5 border transition-colors bg-transparent focus:outline-none ${m.role === "admin"
                                                        ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
                                                        : "text-[#0084ff] border-[#0084ff]/30 bg-[#0084ff]/10"
                                                    } ${isMe ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
                                            >
                                                <option value="admin" className="bg-[#0f1117] text-white">👑 Admin</option>
                                                <option value="agent" className="bg-[#0f1117] text-white">🎧 Agent</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* Pending Invites */}
            {invites.length > 0 && (
                <section>
                    <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                        Pending Invites ({invites.length})
                    </h2>
                    <div className="rounded-xl border border-white/10 overflow-hidden divide-y divide-white/[0.06]">
                        {invites.map((inv) => (
                            <div key={inv.id} className="flex items-center gap-3 px-4 py-3 bg-white/[0.02]">
                                <Clock className="h-4 w-4 text-amber-400/60 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{inv.email}</p>
                                    <p className="text-xs text-white/30 mt-0.5">
                                        Invited as {inv.role} · {new Date(inv.created_at).toLocaleDateString("en-IN")}
                                    </p>
                                </div>
                                <button
                                    onClick={() => revokeInvite(inv.id)}
                                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Revoke invite"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Invite Modal */}
            {showInvite && agencyId && (
                <TeamInviteModal
                    agencyId={agencyId}
                    onClose={() => {
                        setShowInvite(false);
                        if (agencyId) loadInvites(agencyId);
                    }}
                />
            )}
        </div>
    );
}