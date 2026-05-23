import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Mail, Copy, Check, Loader2, CheckCircle } from "lucide-react";

interface Props {
    agencyId: string;
    onClose: () => void;
}

const APP_URL = "https://replora.in";

export function TeamInviteModal({ agencyId, onClose }: Props) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "agent">("agent");
    const [loading, setLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    async function handleCreate() {
        if (!email.trim()) return;
        setLoading(true);
        setError("");

        const { data, error: err } = await supabase
            .from("team_invites")
            .insert({ agency_id: agencyId, email: email.trim(), role })
            .select("invite_code")
            .single();

        if (err || !data) {
            setError(err?.message ?? "Failed to create invite");
            setLoading(false);
            return;
        }

        setInviteLink(`${APP_URL}/signup?invite=${data.invite_code}`);
        setLoading(false);
    }

    function copyLink() {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-white font-semibold text-lg">Invite Team Member</h2>
                        <p className="text-white/40 text-xs mt-0.5">They'll get a signup link to join your workspace</p>
                    </div>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {inviteLink ? (
                    /* Success — show invite link to copy */
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[#00c853]">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm font-medium">Invite link created for {email}</p>
                        </div>
                        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <p className="text-xs text-white/40 mb-1.5">Share this link via WhatsApp or email:</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-[11px] text-[#0084ff] break-all font-mono leading-relaxed">
                                    {inviteLink}
                                </code>
                                <button
                                    onClick={copyLink}
                                    className="flex-shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
                                >
                                    {copied ? <Check className="h-4 w-4 text-[#00c853]" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-white/30">
                            When they sign up with this link they'll be automatically added to your team as <span className="text-white/60 font-medium">{role}</span>.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setInviteLink(""); setEmail(""); }}
                                className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors"
                            >
                                Invite Another
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-lg bg-[#0084ff] text-white text-sm font-medium hover:bg-[#0084ff]/90 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Form */
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-white/60 block mb-1.5">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                    placeholder="agent@yourteam.com"
                                    autoFocus
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#0084ff]/50 focus:ring-1 focus:ring-[#0084ff]/20 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-white/60 block mb-1.5">Role</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(["admin", "agent"] as const).map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setRole(r)}
                                        className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${role === r
                                                ? "bg-[#0084ff]/20 border-[#0084ff]/40 text-[#0084ff]"
                                                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/8 hover:text-white"
                                            }`}
                                    >
                                        {r === "admin" ? "👑 Admin" : "🎧 Agent"}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[11px] text-white/30 mt-1.5 leading-relaxed">
                                {role === "admin"
                                    ? "Full access — sees all conversations, manages team"
                                    : "Limited access — sees only conversations assigned to them"}
                            </p>
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!email.trim() || loading}
                                className="flex-1 py-2.5 rounded-lg bg-[#0084ff] text-white text-sm font-medium hover:bg-[#0084ff]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                            >
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Generate Invite Link
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}