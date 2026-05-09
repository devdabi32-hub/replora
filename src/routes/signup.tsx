import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { MessageCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Chatora" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [agency, setAgency] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0084ff] to-[#0066cc] flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div className="text-xl font-semibold text-white">Chatora</div>
          <div className="text-sm text-white/60">Your AI talks. You watch.</div>
        </div>
        <div className="bg-white/5 rounded-2xl shadow-xl border border-white/10 p-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Create your account</h1>
          <p className="text-sm text-white/60 mb-6">Start your free trial</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/80">Agency name</label>
              <input required value={agency} onChange={(e) => setAgency(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-white/15 focus:border-[#0084ff] focus:ring-2 focus:ring-blue-500/30 outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-white/80">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-white/15 focus:border-[#0084ff] focus:ring-2 focus:ring-blue-500/30 outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-white/80">Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-white/15 focus:border-[#0084ff] focus:ring-2 focus:ring-blue-500/30 outline-none text-sm" />
            </div>
            {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}
            <button disabled={loading} type="submit"
              className="w-full h-11 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
            </button>
          </form>
          <div className="text-center text-sm text-white/60 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[#0084ff] font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}