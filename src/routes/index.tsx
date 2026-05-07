import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Inbox, LayoutDashboard, Users, Check, ArrowRight, Sparkles, Zap, Eye } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WA Monitor — Real-time WhatsApp AI Agent Monitoring" },
      { name: "description", content: "Built for n8n agencies. Monitor every WhatsApp AI conversation in real time with live inbox, dashboards and contact profiles." },
      { property: "og:title", content: "WA Monitor — Real-time WhatsApp AI Monitoring" },
      { property: "og:description", content: "Live inbox, AI dashboard and contact profiles — all in one portal for n8n agencies." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-[#0f1117] text-white border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#0084ff] to-[#0066cc] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <MessageCircle className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-semibold tracking-tight">WA Monitor</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-4 h-9 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] flex items-center transition-colors">Sign in</Link>
            <Link to="/signup" className="px-4 h-9 rounded-md text-sm font-semibold bg-[#0084ff] hover:bg-[#0066cc] text-white flex items-center gap-1.5 transition-colors">
              Start free trial <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,132,255,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 mb-6 shadow-sm">
            <Sparkles className="h-3 w-3 text-[#0084ff]" /> Built for n8n agencies
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.05]">
            Monitor Every WhatsApp AI<br />
            <span className="bg-gradient-to-r from-[#0084ff] to-[#00c853] bg-clip-text text-transparent">Conversation in Real Time</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Built for n8n agencies. Live inbox, AI dashboard and contact profiles — all in one portal.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/signup" className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all">
              Start Free 14-Day Trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors">
              Sign in
            </Link>
          </div>
          <div className="mt-3 text-xs text-slate-500">No credit card required · Cancel anytime</div>

          {/* Dashboard preview */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#0084ff]/20 to-[#00c853]/20 blur-3xl opacity-50" />
            <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-200 bg-slate-50">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-[11px] text-slate-500 font-mono">app.wa-monitor.io/inbox</span>
              </div>
              <div className="grid grid-cols-12 h-[420px]">
                <div className="col-span-4 bg-slate-50/60 border-r border-slate-200 p-3 space-y-2 overflow-hidden">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-slate-100">
                      <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${i===1?"from-blue-500 to-indigo-600":i===2?"from-emerald-500 to-teal-600":i===3?"from-purple-500 to-pink-600":i===4?"from-amber-500 to-orange-600":"from-rose-500 to-red-600"} flex items-center justify-center text-white text-xs font-semibold`}>{String.fromCharCode(64+i)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="h-2.5 w-20 rounded bg-slate-200" />
                        <div className="h-2 w-28 rounded bg-slate-100 mt-1.5" />
                      </div>
                      {i<3 && <span className="h-4 min-w-4 px-1 rounded-full bg-[#0084ff] text-white text-[9px] font-bold flex items-center justify-center">{i}</span>}
                    </div>
                  ))}
                </div>
                <div className="col-span-8 p-6 bg-[#f8fafc] flex flex-col gap-3">
                  <div className="self-start max-w-[70%] bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                    <div className="text-xs text-slate-500 mb-1 font-medium">Client</div>
                    <div className="h-2 w-40 rounded bg-slate-200" />
                    <div className="h-2 w-32 rounded bg-slate-200 mt-1.5" />
                  </div>
                  <div className="self-end max-w-[70%] bg-[#0084ff] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-100 mb-1 font-semibold"><span className="px-1.5 py-0.5 rounded bg-[#00c853]/30">AI</span></div>
                    <div className="h-2 w-48 rounded bg-white/40" />
                    <div className="h-2 w-36 rounded bg-white/40 mt-1.5" />
                    <div className="h-2 w-24 rounded bg-white/40 mt-1.5" />
                  </div>
                  <div className="self-start max-w-[70%] bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                    <div className="text-xs text-slate-500 mb-1 font-medium">Client</div>
                    <div className="h-2 w-28 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-[#0f1117] text-white py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Eye className="h-10 w-10 mx-auto text-[#0084ff] mb-6" />
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
            Do you know what your AI agent<br />is saying to your clients <span className="text-[#0084ff]">right now?</span>
          </h2>
          <p className="mt-6 text-slate-400 text-lg leading-relaxed">
            Most n8n agencies deploy WhatsApp AI agents and pray. WA Monitor gives you live visibility into every conversation, so you can catch hallucinations, fix flows, and prove ROI to clients.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#0084ff]">Features</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mt-2">Everything you need to run AI agents</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Inbox, title: "Live Inbox", desc: "Watch conversations stream in real time. Filter by contact, search messages, and reply if needed.", color: "from-blue-500 to-indigo-600" },
              { icon: LayoutDashboard, title: "AI Dashboard", desc: "Track message volume, AI response rate, and conversation health with beautiful charts.", color: "from-emerald-500 to-teal-600" },
              { icon: Users, title: "Contact Profiles", desc: "Every client gets a profile with full chat history, message counts, and activity status.", color: "from-purple-500 to-pink-600" },
            ].map((f) => (
              <div key={f.title} className="group rounded-2xl border border-slate-200 bg-white p-7 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-lg mb-5`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#0084ff]">How it works</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mt-2">Live in 60 seconds</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {[
              { n: "01", title: "Sign up", desc: "Create your free account. No credit card needed." },
              { n: "02", title: "Get webhook URL", desc: "Copy your unique webhook into any n8n HTTP Request node." },
              { n: "03", title: "See conversations instantly", desc: "Messages stream into your inbox in real time." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-2xl bg-white border border-slate-200 p-7 shadow-sm">
                <div className="text-5xl font-bold text-[#0084ff]/15">{s.n}</div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#0084ff]">Pricing</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mt-2">Simple plans for growing agencies</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Trial", price: "₹0", per: "for 14 days", features: ["Up to 100 conversations", "Live inbox", "Basic dashboard", "Email support"], cta: "Start free", highlight: false },
              { name: "Starter", price: "₹2,999", per: "per month", features: ["Up to 2,000 conversations", "Full AI dashboard", "Contact profiles", "Webhook integrations", "Priority email support"], cta: "Start free trial", highlight: true },
              { name: "Growth", price: "₹7,999", per: "per month", features: ["Unlimited conversations", "Multi-agent workspaces", "Custom retention", "Team seats included", "Dedicated support"], cta: "Start free trial", highlight: false },
            ].map((p) => (
              <div key={p.name} className={`relative rounded-2xl p-7 border transition-all ${p.highlight ? "border-[#0084ff] bg-gradient-to-b from-blue-50/60 to-white shadow-xl scale-[1.02]" : "border-slate-200 bg-white shadow-sm"}`}>
                {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0084ff] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Most popular</div>}
                <div className="text-sm font-semibold text-slate-700">{p.name}</div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">{p.price}</span>
                  <span className="text-sm text-slate-500">{p.per}</span>
                </div>
                <Link to="/signup" className={`mt-6 w-full inline-flex items-center justify-center h-10 rounded-lg text-sm font-semibold transition-colors ${p.highlight ? "bg-[#0084ff] hover:bg-[#0066cc] text-white shadow-md shadow-blue-500/20" : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
                  {p.cta}
                </Link>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-[#00c853] mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0f1117] text-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Zap className="h-10 w-10 mx-auto text-[#00c853] mb-5" />
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Ready to see what your AI is saying?</h2>
          <p className="mt-3 text-slate-400">Start your 14-day free trial. Set up in under a minute.</p>
          <Link to="/signup" className="mt-7 inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all">
            Start Free 14-Day Trial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0c12] text-slate-400 py-10 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#0084ff] to-[#0066cc] flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">WA Monitor</span>
          </div>
          <div className="text-xs">© WA Monitor 2026 · All rights reserved</div>
        </div>
      </footer>
    </div>
  );
}