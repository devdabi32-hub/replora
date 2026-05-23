import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Replora" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [agency, setAgency] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: { agency_name: agency },
      },
    });
    setLoading(false);
    if (error) return setError(error.message);

    // Claim invite if present in URL
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get("invite");
    if (inviteCode) {
      await supabase.rpc("claim_invite", { p_invite_code: inviteCode });
    }

    navigate({ to: "/onboarding" });
  };

  const signInWithGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) {
      setGoogleLoading(false);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <LogoMark className="h-12 w-12 mb-3" />
          <div className="text-xl font-semibold text-white">Replora</div>
          <div className="text-sm text-white/60">Your AI talks. You watch.</div>
        </div>
        <div className="bg-white/5 rounded-2xl shadow-xl border border-white/10 p-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Create your account</h1>
          <p className="text-sm text-white/60 mb-6">Start your free trial</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/80">Agency name</label>
              <input required value={agency} onChange={(e) => setAgency(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-lg bg-white/[0.08] border border-white/15 text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-blue-500/30 outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-white/80">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-lg bg-white/[0.08] border border-white/15 text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-blue-500/30 outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-white/80">Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-lg bg-white/[0.08] border border-white/15 text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-blue-500/30 outline-none text-sm" />
            </div>
            {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}
            <button disabled={loading} type="submit"
              className="w-full h-11 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
            </button>
            <p className="text-center text-[11px] text-white/50">No credit card · 14-day free trial</p>
          </form>
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] uppercase tracking-wider text-white/50 font-medium">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading}
            className="w-full h-11 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm font-medium flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
            )}
            Continue with Google
          </button>
          <div className="text-center text-sm text-white/60 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[#0084ff] font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}