import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Eye,
  ArrowRight,
  Inbox,
  LayoutDashboard,
  Users,
  KeyRound,
  Bot,
  Flame,
  Search,
  Check,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Replora — Your AI Talks. You Watch." },
      {
        name: "description",
        content:
          "Monitor every WhatsApp AI conversation in real time. Built for n8n agencies in India. Catch mistakes, prove ROI, and never lose a hot lead.",
      },
      { property: "og:title", content: "Replora — Your AI Talks. You Watch." },
      {
        property: "og:description",
        content:
          "Real-time WhatsApp AI conversation monitoring for n8n agencies. Live inbox, dashboards, contact profiles.",
      },
    ],
  }),
  component: Landing,
});

function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div
      className={`${className} relative rounded-xl bg-gradient-to-br from-[#0084ff] to-[#00c853] flex items-center justify-center shadow-lg shadow-[#0084ff]/30`}
    >
      <Eye className="h-1/2 w-1/2 text-white" strokeWidth={2.5} />
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-black text-white antialiased font-sans selection:bg-[#0084ff]/40">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full bg-[#0084ff]/15 blur-[120px]" />
        <div className="absolute top-[300px] right-0 h-[500px] w-[600px] rounded-full bg-[#00c853]/10 blur-[120px]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <span className="font-semibold tracking-tight text-[15px]">Replora</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/api-docs" className="hover:text-white transition-colors">API Docs</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-3 h-9 rounded-md text-sm text-white/70 hover:text-white flex items-center transition-colors">Login</Link>
            <Link to="/signup" className="px-4 h-9 rounded-md text-sm font-semibold bg-[#0084ff] hover:bg-[#0073e0] text-white flex items-center gap-1.5 shadow-lg shadow-[#0084ff]/30 transition-all">
              Start Free Trial <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="pt-20 pb-24 px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur px-3.5 py-1.5 text-xs font-medium text-white/80 mb-8">
              <Sparkles className="h-3 w-3 text-[#00c853]" /> Built for n8n agencies in India 🇮🇳
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95]">
              <span className="bg-gradient-to-br from-[#3aa0ff] via-[#0084ff] to-[#00c853] bg-clip-text text-transparent">
                Your AI Talks.<br />You Watch.
              </span>
            </h1>
            <p className="mt-7 text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Monitor every WhatsApp AI conversation in real time. Catch mistakes, prove ROI, and never lose a hot lead — all from one portal.
            </p>
            <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
              <Link to="/signup" className="inline-flex items-center gap-2 h-12 px-7 rounded-lg bg-[#0084ff] hover:bg-[#0073e0] text-white text-sm font-semibold shadow-xl shadow-[#0084ff]/30 transition-all hover:scale-[1.02]">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 h-12 px-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 text-white text-sm font-semibold transition-all">
                See how it works
              </a>
            </div>
            <div className="mt-4 text-xs text-white/40">No credit card · 14-day free trial · Cancel anytime</div>

            {/* Inbox mockup */}
            <div className="mt-20 relative max-w-5xl mx-auto">
              <div className="absolute -inset-8 bg-gradient-to-r from-[#0084ff]/30 via-transparent to-[#00c853]/30 blur-3xl opacity-60" />
              <div className="relative rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-[#0d0d0d]">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-[11px] text-white/40 font-mono">app.replora.com/inbox</span>
                </div>
                <div className="grid grid-cols-12 h-[460px]">
                  <div className="col-span-4 bg-[#111B21] border-r border-white/[0.04] overflow-hidden">
                    <div className="p-3 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2 px-3 h-8 rounded-md bg-white/[0.04] text-[11px] text-white/40">
                        <Search className="h-3 w-3" /> Search
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      {[
                        { name: "Rohan Mehta", msg: "Yes I'm ready to buy", cat: "hot", unread: 2 },
                        { name: "Priya Sharma", msg: "What's the price?", cat: "warm", unread: 1 },
                        { name: "Arjun Kumar", msg: "Thanks for the info", cat: "cold" },
                        { name: "Neha Patel", msg: "Can we schedule a call?", cat: "hot" },
                        { name: "Vikram Singh", msg: "Got it, will think", cat: "warm" },
                      ].map((c, i) => (
                        <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${i===0 ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}>
                          <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${i===0?"from-blue-500 to-indigo-600":i===1?"from-emerald-500 to-teal-600":i===2?"from-purple-500 to-pink-600":i===3?"from-amber-500 to-orange-600":"from-rose-500 to-red-600"} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                            {c.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] font-medium text-white truncate">{c.name}</span>
                              <span className="text-[10px]">{c.cat==="hot"?"🔥":c.cat==="warm"?"🟡":"🔵"}</span>
                            </div>
                            <div className="text-[11px] text-white/40 truncate">{c.msg}</div>
                          </div>
                          {c.unread && <span className="h-4 min-w-4 px-1 rounded-full bg-[#00c853] text-black text-[9px] font-bold flex items-center justify-center">{c.unread}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-8 bg-[#0B141A] flex flex-col">
                    <div className="flex items-center gap-3 px-5 h-14 border-b border-white/[0.04] bg-[#202C33]">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">R</div>
                      <div className="text-left">
                        <div className="text-[13px] font-medium text-white">Rohan Mehta</div>
                        <div className="text-[11px] text-[#00c853] flex items-center gap-1"><Flame className="h-2.5 w-2.5" /> Hot lead</div>
                      </div>
                    </div>
                    <div className="flex-1 p-6 flex flex-col gap-2.5 overflow-hidden">
                      <div className="self-start max-w-[70%] bg-[#202C33] text-white rounded-lg rounded-tl-sm px-3.5 py-2 shadow">
                        <div className="text-[12px] leading-snug">Hi, do you have the new model in stock?</div>
                        <div className="text-[10px] text-white/40 mt-1 text-right">10:24 AM</div>
                      </div>
                      <div className="self-end max-w-[70%] bg-[#005C4B] text-white rounded-lg rounded-tr-sm px-3.5 py-2 shadow">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold mb-0.5">
                          <span className="px-1.5 py-px rounded bg-[#00c853]/30 text-[#a7f3d0]">AI</span>
                        </div>
                        <div className="text-[12px] leading-snug">Yes! We have it in stock. Would you like to book a demo today?</div>
                        <div className="text-[10px] text-white/50 mt-1 text-right">10:24 AM ✓✓</div>
                      </div>
                      <div className="self-start max-w-[70%] bg-[#202C33] text-white rounded-lg rounded-tl-sm px-3.5 py-2 shadow">
                        <div className="text-[12px] leading-snug">Yes I'm ready to buy</div>
                        <div className="text-[10px] text-white/40 mt-1 text-right">10:25 AM</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="py-28 px-6 lg:px-8 border-t border-white/[0.04] bg-[#0a0a0a]/60">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
                Do you know what your AI agent<br />
                <span className="text-white/50">is saying right now?</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { emoji: "🤖", title: "AI Hallucinations", desc: "Your bot confidently gives wrong info to clients — pricing, features, promises you can't keep." },
                { emoji: "😤", title: "Missed Hot Leads", desc: "A lead says \"I'm ready to buy\" and your AI ignores the urgency. Sales gone." },
                { emoji: "🔍", title: "Zero Visibility", desc: "You deployed the agent and prayed. Now you're flying blind with no way to audit." },
              ].map((c) => (
                <div key={c.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur p-7 hover:bg-white/[0.04] hover:border-white/[0.15] transition-all">
                  <div className="text-3xl mb-4">{c.emoji}</div>
                  <h3 className="text-lg font-semibold text-white">{c.title}</h3>
                  <p className="mt-2 text-sm text-white/55 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-28 px-6 lg:px-8 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0084ff]">Features</div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-3">Full visibility. Zero guesswork.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { icon: Inbox, title: "Live Inbox", desc: "WhatsApp Web-style inbox. Watch every conversation happen live, in real time.", color: "from-[#0084ff] to-[#0066cc]" },
                { icon: LayoutDashboard, title: "AI Dashboard", desc: "Message volume, AI response rate, lead categories — beautiful charts that prove ROI.", color: "from-[#00c853] to-[#00875a]" },
                { icon: Users, title: "Contact Profiles", desc: "Every contact with full history, tags, lead category, and last activity timestamp.", color: "from-purple-500 to-pink-600" },
                { icon: KeyRound, title: "One Webhook", desc: "Drop your wam_sk_ key into n8n. You're live in 60 seconds. No SDK, no setup.", color: "from-amber-500 to-orange-600" },
              ].map((f) => (
                <div key={f.title} className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur p-8 hover:bg-white/[0.04] hover:border-white/[0.15] transition-all overflow-hidden">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-lg mb-5`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-28 px-6 lg:px-8 border-t border-white/[0.04] bg-[#0a0a0a]/60">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00c853]">How it works</div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-3">Live in 60 seconds</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { n: "01", title: "Sign up free", desc: "Create your account. No credit card needed." },
                { n: "02", title: "Copy your key", desc: "Grab your unique wam_sk_… webhook key." },
                { n: "03", title: "Paste into n8n", desc: "Drop it into any HTTP Request node." },
                { n: "04", title: "Watch live", desc: "Every message appears in your inbox instantly." },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur p-6">
                  <div className="text-3xl font-bold bg-gradient-to-br from-[#0084ff] to-[#00c853] bg-clip-text text-transparent">{s.n}</div>
                  <h3 className="mt-3 text-base font-semibold text-white">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-white/55 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-28 px-6 lg:px-8 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0084ff]">Pricing</div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-3">Simple pricing. No surprises.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { name: "Trial", price: "₹0", per: "/ 14 days", features: ["Live inbox", "Dashboard", "1 WhatsApp number", "Email support"], highlight: false },
                { name: "Starter", price: "₹2,999", per: "/ month", features: ["1 WhatsApp number", "Unlimited messages", "Full AI dashboard", "Contact profiles", "Priority support"], highlight: true },
                { name: "Growth", price: "₹7,999", per: "/ month", features: ["5 WhatsApp numbers", "Everything in Starter", "Team seats", "Custom retention"], highlight: false },
                { name: "Agency", price: "₹19,999", per: "/ month", features: ["Unlimited numbers", "White label", "Dedicated support", "Custom domain"], highlight: false },
              ].map((p) => (
                <div key={p.name} className={`relative rounded-2xl p-7 border transition-all ${p.highlight ? "border-[#0084ff]/60 bg-gradient-to-b from-[#0084ff]/[0.08] to-white/[0.02] shadow-2xl shadow-[#0084ff]/10" : "border-white/[0.08] bg-white/[0.02]"} backdrop-blur`}>
                  {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#0084ff] to-[#00c853] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">Most Popular</div>}
                  <div className="text-sm font-semibold text-white/80">{p.name}</div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold tracking-tight text-white">{p.price}</span>
                    <span className="text-xs text-white/50">{p.per}</span>
                  </div>
                  <Link to="/signup" className={`mt-6 w-full inline-flex items-center justify-center h-10 rounded-lg text-sm font-semibold transition-all ${p.highlight ? "bg-[#0084ff] hover:bg-[#0073e0] text-white shadow-lg shadow-[#0084ff]/30" : "bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white"}`}>
                    Start Free Trial
                  </Link>
                  <ul className="mt-6 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                        <Check className="h-4 w-4 text-[#00c853] mt-0.5 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="py-28 px-6 lg:px-8 border-t border-white/[0.04] bg-[#0a0a0a]/60">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">Trusted by n8n agencies across India</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { quote: "Replora helped me catch a broken AI flow before my client noticed. Saved me a ₹50,000 contract.", name: "Rohan M.", role: "Founder, Automateup", color: "from-blue-500 to-indigo-600" },
                { quote: "Finally I can show clients exactly how their AI agent is performing. Dashboards are beautiful.", name: "Priya S.", role: "CEO, GrowthBots.in", color: "from-emerald-500 to-teal-600" },
                { quote: "Setup took under 2 minutes. The inbox is exactly like WhatsApp Web. My team loves it.", name: "Arjun K.", role: "Lead, FlowAgency", color: "from-purple-500 to-pink-600" },
              ].map((t) => (
                <div key={t.name} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur p-7 hover:bg-white/[0.04] transition-all">
                  <div className="text-[#00c853] text-2xl leading-none mb-3">&ldquo;</div>
                  <p className="text-[15px] text-white/80 leading-relaxed">{t.quote}</p>
                  <div className="mt-5 flex items-center gap-3 pt-5 border-t border-white/[0.06]">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-semibold`}>{t.name.charAt(0)}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-xs text-white/50">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="px-6 lg:px-8 py-20 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-[#0084ff] via-[#0066cc] to-[#00c853] p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),transparent_50%)]" />
            <div className="relative">
              <Bot className="h-12 w-12 mx-auto text-white mb-5" />
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">Ready to see what your AI is saying?</h2>
              <p className="mt-4 text-white/85 text-lg max-w-xl mx-auto">Join 50+ n8n agencies already monitoring their AI agents with Replora.</p>
              <Link to="/signup" className="mt-8 inline-flex items-center gap-2 h-12 px-7 rounded-lg bg-black hover:bg-white hover:text-black text-white text-sm font-semibold shadow-xl transition-all">
                Start Your Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 lg:px-8 py-14 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <Link to="/" className="flex items-center gap-2.5">
                <Logo className="h-8 w-8" />
                <span className="font-semibold tracking-tight">Replora</span>
              </Link>
              <p className="mt-3 text-sm text-white/50">Your AI talks. You watch.</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-white/60">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <Link to="/api-docs" className="hover:text-white transition-colors">API Docs</Link>
              <Link to="/login" className="hover:text-white transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/[0.04] text-xs text-white/40">
            © Replora 2026 · Made in India 🇮🇳
          </div>
        </footer>
      </main>
    </div>
  );
}