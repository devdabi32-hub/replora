import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { MessageCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — WA Monitor" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0084ff] to-[#0066cc] flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div className="text-xl font-semibold text-slate-900">WA Monitor</div>
          <div className="text-sm text-slate-500">AI Agent Portal</div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-6">Sign in to your account</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-slate-300 focus:border-[#0084ff] focus:ring-2 focus:ring-blue-100 outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-slate-300 focus:border-[#0084ff] focus:ring-2 focus:ring-blue-100 outline-none text-sm" />
            </div>
            {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
            <button disabled={loading} type="submit"
              className="w-full h-11 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
            </button>
          </form>
          <div className="text-center text-sm text-slate-500 mt-6">
            New to WA Monitor?{" "}
            <Link to="/signup" className="text-[#0084ff] font-medium hover:underline">Start free trial</Link>
          </div>
        </div>
      </div>
    </div>
  );
}