import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "Replora Partner Program — Earn Forever" },
      { name: "description", content: "Join Replora's partner program. Refer agencies, earn recurring commission every month for life. No cap. No expiry." },
    ],
  }),
  component: PartnerPage,
});

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
.pp{background:#000;color:rgba(255,255,255,.88);font-family:'DM Sans',sans-serif;overflow-x:hidden;line-height:1.6;min-height:100vh}
.pp h1,.pp h2,.pp h3,.pp h4{font-family:'Syne',sans-serif;line-height:1}
.pp-amb{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.pp-a1{position:absolute;top:-80px;left:50%;transform:translateX(-50%);width:1000px;height:650px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,200,83,.12) 0%,transparent 70%);filter:blur(50px);animation:ppa1 8s ease-in-out infinite}
.pp-a2{position:absolute;top:45%;right:-150px;width:600px;height:550px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,132,255,.09) 0%,transparent 70%);filter:blur(50px);animation:ppa2 10s ease-in-out infinite}
@keyframes ppa1{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-30px)}}
@keyframes ppa2{0%,100%{transform:translateY(0)}50%{transform:translateY(20px)}}
.pp-grid{position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px);background-size:80px 80px;z-index:0}
.pp-nav{position:sticky;top:0;z-index:100;backdrop-filter:blur(24px);background:rgba(0,0,0,.78);border-bottom:1px solid rgba(255,255,255,.06)}
.pp-ni{max-width:1200px;margin:0 auto;padding:0 32px;height:64px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.pp-logo{display:flex;align-items:center;gap:10px;text-decoration:none}
.pp-li{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#0084ff,#00c853);display:flex;align-items:center;justify-content:center;box-shadow:0 0 22px rgba(0,132,255,.35);flex-shrink:0}
.pp-ln{font-family:'Syne',sans-serif;font-weight:700;font-size:17px;color:#fff}
.pp-nl{display:flex;gap:28px;list-style:none;align-items:center;margin:0;padding:0}
.pp-nl a{text-decoration:none;font-size:13.5px;color:rgba(255,255,255,.55);transition:color .2s}
.pp-nl a:hover{color:#fff}
.pp-ppill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;background:linear-gradient(135deg,rgba(0,200,83,.15),rgba(0,132,255,.1));border:1px solid rgba(0,200,83,.3);color:#00c853;padding:5px 13px;border-radius:999px;text-decoration:none;transition:all .25s}
.pp-ppill:hover{border-color:rgba(0,200,83,.5);box-shadow:0 0 18px rgba(0,200,83,.2)}
.pp-dot{width:6px;height:6px;background:#00c853;border-radius:50%;animation:ppdot 2s ease-in-out infinite;flex-shrink:0}
@keyframes ppdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
.pp-nc{display:flex;align-items:center;gap:8px;flex-shrink:0}
.pp-bg{padding:0 14px;height:36px;border-radius:8px;font-size:13px;color:rgba(255,255,255,.6);background:none;border:none;text-decoration:none;display:flex;align-items:center;transition:color .2s}
.pp-bg:hover{color:#fff}
.pp-bp{padding:0 18px;height:36px;border-radius:8px;font-size:13px;font-weight:600;color:#fff;background:#0084ff;border:none;display:flex;align-items:center;gap:6px;text-decoration:none;box-shadow:0 0 18px rgba(0,132,255,.3);transition:all .2s}
.pp-bp:hover{background:#0073e0;transform:translateY(-1px)}
.pp section{position:relative;z-index:1}
.pp-c{max-width:960px;margin:0 auto;padding:0 28px}
.pp-back{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:rgba(255,255,255,.5);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px 16px;text-decoration:none;margin:24px 0 0;transition:all .2s}
.pp-back:hover{color:#fff;background:rgba(255,255,255,.08)}
.pp-hero{padding:64px 0 48px;text-align:center}
.pp-hbdg{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:#00c853;border:1px solid rgba(0,200,83,.25);background:rgba(0,200,83,.06);padding:5px 14px;border-radius:99px;margin-bottom:24px}
.pp-hero h1{font-size:clamp(34px,6vw,62px);font-weight:800;letter-spacing:-.02em;margin-bottom:16px;line-height:1.05}
.pp-gw{background:linear-gradient(135deg,#fff 30%,rgba(255,255,255,.55));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.pp-gc{background:linear-gradient(135deg,#0084ff,#00c853);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.pp-sub{font-size:16px;color:rgba(255,255,255,.42);max-width:520px;margin:0 auto 36px;line-height:1.65;font-weight:300}
.pp-cta{display:inline-flex;align-items:center;gap:8px;background:#0084ff;color:#fff;font-size:14px;font-weight:600;padding:13px 28px;border-radius:10px;text-decoration:none;box-shadow:0 0 36px rgba(0,132,255,.3);transition:all .2s}
.pp-cta:hover{background:#0073e0;transform:translateY(-2px)}
.pp-lbl{font-size:10px;font-weight:600;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.12em;margin-bottom:14px}
.pp-div{height:1px;background:rgba(255,255,255,.06);margin:40px 0}
.pp-wg{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.pp-wc{background:#0d1018;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:20px 22px;transition:all .3s;position:relative;overflow:hidden}
.pp-wc::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent)}
.pp-wc:hover{border-color:rgba(255,255,255,.14);transform:translateY(-3px)}
.pp-wi{font-size:20px;margin-bottom:12px;display:block}
.pp-wt{font-family:'Syne',sans-serif;font-size:14px;font-weight:600;color:rgba(255,255,255,.88);margin-bottom:6px}
.pp-wd{font-size:13px;color:rgba(255,255,255,.42);line-height:1.6;font-weight:300}
.pp-wh{display:inline-block;font-size:11px;font-weight:500;margin-top:10px;padding:3px 9px;border-radius:99px}
.pp-vs{background:#0d1018;border:1px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden}
.pp-vr{display:grid;grid-template-columns:2fr 1fr 1fr 1.2fr;border-bottom:1px solid rgba(255,255,255,.06)}
.pp-vr:last-child{border-bottom:none}
.pp-vr.hd{background:rgba(255,255,255,.02)}
.pp-vc{padding:12px 16px;font-size:13px;color:rgba(255,255,255,.42);display:flex;align-items:center}
.pp-vc.hc{font-size:10px;font-weight:500;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.08em;padding:9px 16px}
.pp-vc.feat{color:rgba(255,255,255,.88)}
.pp-vc.win{color:#00c853;font-weight:500}
.pp-vc.lose{color:rgba(255,255,255,.3)}
.pp-vc.rc{background:rgba(0,132,255,.04)}
.pp-comm-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.pp-comm-card{background:#0d1018;border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:22px;transition:all .3s;text-align:center}
.pp-comm-card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.14)}
.pp-comm-card.agency{border-color:rgba(245,158,11,.2);background:rgba(245,158,11,.03)}
.pp-comm-plan{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:rgba(255,255,255,.4);margin-bottom:12px}
.pp-comm-rate{font-family:'Syne',sans-serif;font-size:42px;font-weight:800;line-height:1;margin-bottom:6px}
.pp-comm-sub{font-size:12px;color:rgba(255,255,255,.3);font-weight:300;margin-bottom:16px}
.pp-comm-earn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:10px 14px}
.pp-comm-earn-lbl{font-size:10px;color:rgba(255,255,255,.3);margin-bottom:4px}
.pp-comm-earn-val{font-family:'Syne',sans-serif;font-size:17px;font-weight:700}
.pp-comm-price{font-size:11px;color:rgba(255,255,255,.3);margin-top:12px;font-weight:300}
.pp-calc{background:#0d1018;border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:28px}
.pp-ct{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;margin-bottom:4px}
.pp-cs{font-size:13px;color:rgba(255,255,255,.42);font-weight:300;margin-bottom:24px}
.pp-cg{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px}
.pp-cc{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:16px}
.pp-cc.fc{border-color:rgba(0,132,255,.25);background:rgba(0,132,255,.04)}
.pp-cpn{font-family:'Syne',sans-serif;font-size:13px;font-weight:600;margin-bottom:2px;display:flex;align-items:center;gap:6px}
.pp-cpp{font-size:11px;color:rgba(255,255,255,.3);margin-bottom:14px;font-weight:300}
.pp-sr{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.pp-sl{font-size:11px;color:rgba(255,255,255,.3);white-space:nowrap}
input[type=range]{flex:1;-webkit-appearance:none;height:3px;background:rgba(255,255,255,.1);border-radius:99px;outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#0084ff;box-shadow:0 0 8px rgba(0,132,255,.5);cursor:pointer;transition:transform .15s}
input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.25)}
.pp-sv{font-size:13px;font-weight:500;color:#fff;min-width:22px;text-align:right}
.pp-earn-box{background:#000;border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:12px 14px;text-align:center}
.pp-earn-lbl{font-size:10px;color:rgba(255,255,255,.3);margin-bottom:4px}
.pp-earn-val{font-family:'Syne',sans-serif;font-size:20px;font-weight:700}
.pp-tot{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
.pp-tb{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:16px;text-align:center}
.pp-tb.hb{background:rgba(0,200,83,.05);border-color:rgba(0,200,83,.2)}
.pp-tbl{font-size:11px;color:rgba(255,255,255,.3);margin-bottom:6px}
.pp-tbn{font-family:'Syne',sans-serif;font-size:28px;font-weight:700}
.pp-nb{margin-top:14px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px 16px;font-size:13px;color:rgba(255,255,255,.42);line-height:1.55;font-weight:300}
.pp-pg{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.pp-pc{background:#0d1018;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:18px;transition:all .3s}
.pp-pc:hover{border-color:rgba(255,255,255,.14);transform:translateY(-2px)}
.pp-pi{font-size:22px;margin-bottom:10px}
.pp-pt{font-family:'Syne',sans-serif;font-size:13px;font-weight:600;margin-bottom:5px}
.pp-pd{font-size:12px;color:rgba(255,255,255,.42);line-height:1.55;font-weight:300}
.pp-flow{display:flex;flex-direction:column;position:relative}
.pp-flow::before{content:'';position:absolute;left:19px;top:20px;bottom:20px;width:1px;background:rgba(255,255,255,.07)}
.pp-fs{display:flex;gap:18px;align-items:flex-start;padding:14px 0}
.pp-fn{width:38px;height:38px;border-radius:50%;background:#0d1018;border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;flex-shrink:0;position:relative;z-index:1;color:#0084ff}
.pp-fc2{padding-top:8px}
.pp-ft{font-family:'Syne',sans-serif;font-size:14px;font-weight:500;margin-bottom:4px;color:rgba(255,255,255,.88)}
.pp-fd{font-size:13px;color:rgba(255,255,255,.42);font-weight:300;line-height:1.5}
.pp-bcta{text-align:center;padding:56px 24px;background:#0d1018;border:1px solid rgba(255,255,255,.07);border-radius:20px;position:relative;overflow:hidden;margin-bottom:80px}
.pp-bcta::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:300px;height:1px;background:linear-gradient(90deg,transparent,#0084ff,transparent)}
.pp-bcta::after{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:200px;height:120px;background:radial-gradient(ellipse,rgba(0,132,255,.08),transparent 70%);pointer-events:none}
.pp-btag{font-family:'Syne',sans-serif;font-size:clamp(22px,4vw,36px);font-weight:800;letter-spacing:-.02em;margin-bottom:12px;line-height:1.15}
.pp-bsub{font-size:14px;color:rgba(255,255,255,.42);margin-bottom:28px;font-weight:300}
.pp-wa{display:inline-flex;align-items:center;gap:9px;background:#00c853;color:#fff;font-size:14px;font-weight:500;padding:13px 28px;border-radius:10px;text-decoration:none;box-shadow:0 0 30px rgba(0,200,83,.25);transition:all .2s}
.pp-wa:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(0,200,83,.4)}
.pp-fbdg{font-size:9px;font-weight:500;background:rgba(0,132,255,.15);color:#0084ff;padding:2px 6px;border-radius:99px;text-transform:uppercase;letter-spacing:.06em}
.pp-rv{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
.pp-rv.vis{opacity:1;transform:translateY(0)}
.pp-stg>*{opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease}
.pp-stg.vis>*:nth-child(1){opacity:1;transform:none;transition-delay:.05s}
.pp-stg.vis>*:nth-child(2){opacity:1;transform:none;transition-delay:.12s}
.pp-stg.vis>*:nth-child(3){opacity:1;transform:none;transition-delay:.19s}
.pp-stg.vis>*:nth-child(4){opacity:1;transform:none;transition-delay:.26s}
.pp-stg.vis>*:nth-child(5){opacity:1;transform:none;transition-delay:.33s}
.pp-stg.vis>*:nth-child(6){opacity:1;transform:none;transition-delay:.40s}
@media(max-width:900px){.pp-comm-cards,.pp-cg{grid-template-columns:1fr 1fr}.pp-wg{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.pp-comm-cards,.pp-cg,.pp-wg{grid-template-columns:1fr}.pp-nl{display:none}.pp-c{padding:0 20px}.pp-tot,.pp-pg{grid-template-columns:1fr 1fr}.pp-vr{grid-template-columns:3fr 1fr}.pp-vr .pp-vc:nth-child(2),.pp-vr .pp-vc:nth-child(3){display:none}}
`;

const WaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.066 22l4.948-1.334A9.958 9.958 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
  </svg>
);
const Eye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const Arr = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
);
const BackArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
);

function PartnerPage() {
  const [s, setS] = useState(10);
  const [p, setP] = useState(10);
  const [g, setG] = useState(10);

  const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
  const sE = s * 999 * 0.25;
  const pE = p * 2499 * 0.30;
  const gE = g * 4999 * 0.35;
  const tot = s + p + g;
  const totE = sE + pE + gE;

  useEffect(() => {
    const obs = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); obs.unobserve(e.target); } });
    }, { threshold: 0.07 });
    document.querySelectorAll(".pp-rv, .pp-stg").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="pp">
      <style>{css}</style>
      <div className="pp-amb"><div className="pp-a1" /><div className="pp-a2" /></div>
      <div className="pp-grid" />

      {/* NAV */}
      <nav className="pp-nav">
        <div className="pp-ni">
          <Link to="/" className="pp-logo">
            <div className="pp-li"><Eye /></div>
            <span className="pp-ln">Replora</span>
          </Link>
          <ul className="pp-nl">
            <li><Link to="/">Home</Link></li>
            <li><a href="/#features">Features</a></li>
            <li><a href="/#pricing">Pricing</a></li>
            <li><Link to="/api-docs">Docs</Link></li>
            <li><Link to="/partner" className="pp-ppill"><span className="pp-dot" /> Partner Program <Arr s={11} /></Link></li>
          </ul>
          <div className="pp-nc">
            <Link to="/login" className="pp-bg">Login</Link>
            <Link to="/signup" className="pp-bp">Start Free Trial <Arr /></Link>
          </div>
        </div>
      </nav>

      <section>
        <div className="pp-c">
          <Link to="/" className="pp-back"><BackArrow /> Back to Replora</Link>

          {/* HERO */}
          <div className="pp-hero">
            <div className="pp-hbdg"><span className="pp-dot" /> Partner Program — Now Open</div>
            <h1>
              <span className="pp-gw">Earn </span><span className="pp-gc">forever.</span>
              <br /><span className="pp-gw">Not just 2 years.</span>
            </h1>
            <p className="pp-sub">Join the world's first WhatsApp AI monitoring platform. Refer agencies. Earn recurring commission every single month — for life. No cap. No expiry.</p>
            <a href="https://wa.me/918989568529?text=Hi, I want to join the Replora Partner Program" className="pp-cta">
              <WaIcon /> Apply on WhatsApp
            </a>
          </div>

          {/* WHY */}
          <div className="pp-lbl">Why choose Replora</div>
          <div className="pp-wg pp-stg pp-rv">
            {[
              ["♾️", "Lifetime commissions", "WATI cuts you off after 2 years. We pay every month — forever — as long as your client stays active.", "Refer once. Earn forever.", "rgba(0,200,83,.1)", "#00c853"],
              ["💸", "Monthly UPI payout", "WATI pays quarterly via PayPal. We pay on the 1st of every month, directly to your UPI. No delays.", "₹500 minimum payout", "rgba(245,158,11,.1)", "#f59e0b"],
              ["🤖", "Built for AI agencies", "Replora is the only WhatsApp monitoring tool built for AI agents. Every client you have is a perfect lead.", "Niche owned — no competition", "rgba(139,92,246,.1)", "#8b5cf6"],
              ["🎁", "30-day trial for clients", "Your referral code unlocks a 30-day free trial — vs 14 days standard. Makes your pitch easier to close.", "Double trial duration", "rgba(0,200,83,.1)", "#00c853"],
              ["🔒", "Simple flat commissions", "No complicated tiers. You earn 25–35% from day one based on the plan your client chooses.", "Clear. Simple. Forever.", "rgba(0,132,255,.1)", "#0084ff"],
              ["📊", "Real-time dashboard", "Track every referred client, their plan, and your exact earnings in your partner dashboard.", "Full transparency", "rgba(0,200,83,.1)", "#00c853"],
            ].map(([icon, title, desc, hl, bg, col]) => (
              <div className="pp-wc" key={title as string}>
                <span className="pp-wi">{icon}</span>
                <div className="pp-wt">{title as string}</div>
                <div className="pp-wd">{desc as string}</div>
                <span className="pp-wh" style={{ background: bg as string, color: col as string }}>{hl as string}</span>
              </div>
            ))}
          </div>

          <div className="pp-div" />

          {/* VS TABLE */}
          <div className="pp-lbl">How we compare — partner programs</div>
          <div className="pp-vs pp-rv">
            <div className="pp-vr hd">
              <div className="pp-vc hc">Feature</div>
              <div className="pp-vc hc">WATI</div>
              <div className="pp-vc hc">AiSensy</div>
              <div className="pp-vc hc" style={{ color: "#0084ff" }}>Replora ✦</div>
            </div>
            {[
              ["Commission rate", "20% flat", "20% flat", "25% – 35%"],
              ["Commission duration", "2 years max", "Limited", "Lifetime ♾️"],
              ["Payout frequency", "Quarterly", "Quarterly", "Monthly (1st)"],
              ["Payout method", "PayPal only", "Bank transfer", "UPI instant"],
              ["Client trial bonus", "None", "None", "30-day trial"],
              ["Commission structure", "Complicated tiers", "Complicated tiers", "Simple & flat"],
            ].map(([f, w, a, r]) => (
              <div className="pp-vr" key={f}>
                <div className="pp-vc feat">{f}</div>
                <div className="pp-vc lose">{w}</div>
                <div className="pp-vc lose">{a}</div>
                <div className="pp-vc win rc">{r}</div>
              </div>
            ))}
          </div>

          <div className="pp-div" />

          {/* COMMISSION CARDS */}
          <div className="pp-lbl">What you earn per plan</div>
          <div className="pp-comm-cards pp-stg pp-rv">
            {[
              { plan: "Starter", rate: "25%", color: "#0084ff", earn: "₹250", price: "Client pays ₹999/month", border: "rgba(255,255,255,.07)", bg: "#0d1018", agency: false },
              { plan: "Pro", rate: "30%", color: "#0084ff", earn: "₹750", price: "Client pays ₹2,499/month", border: "rgba(0,132,255,.3)", bg: "rgba(0,132,255,.06)", agency: false },
              { plan: "Growth", rate: "35%", color: "#00c853", earn: "₹1,750", price: "Client pays ₹4,999/month", border: "rgba(0,200,83,.3)", bg: "rgba(0,200,83,.06)", agency: false },
              { plan: "Agency", rate: "20%", color: "#f59e0b", earn: "Custom", price: "Custom pricing · Contact us", border: "rgba(245,158,11,.2)", bg: "rgba(245,158,11,.03)", agency: true },
            ].map(c => (
              <div key={c.plan} className="pp-comm-card" style={{ border: `1px solid ${c.border}`, background: c.bg }}>
                <div className="pp-comm-plan">{c.plan}</div>
                <div className="pp-comm-rate" style={{ color: c.color }}>{c.rate}</div>
                <div className="pp-comm-sub">{c.agency ? "or negotiable" : "recurring commission"}</div>
                <div className="pp-comm-earn">
                  <div className="pp-comm-earn-lbl">You earn per client/month</div>
                  <div className="pp-comm-earn-val" style={{ color: c.color }}>{c.earn}</div>
                </div>
                <div className="pp-comm-price">{c.price}</div>
              </div>
            ))}
          </div>

          <div className="pp-div" />

          {/* CALCULATOR */}
          <div className="pp-calc pp-rv">
            <div className="pp-ct">Live Earnings Calculator</div>
            <div className="pp-cs">Drag the sliders to see exactly what you'd earn</div>
            <div className="pp-cg">
              {/* Starter */}
              <div className="pp-cc">
                <div className="pp-cpn">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8", display: "inline-block" }} /> Starter
                </div>
                <div className="pp-cpp">₹999/month · 25% commission</div>
                <div className="pp-sr">
                  <span className="pp-sl">Clients</span>
                  <input type="range" min={0} max={50} step={1} value={s} onChange={e => setS(+e.target.value)} />
                  <span className="pp-sv">{s}</span>
                </div>
                <div className="pp-earn-box">
                  <div className="pp-earn-lbl">You earn / month</div>
                  <div className="pp-earn-val" style={{ color: "#0084ff" }}>{fmt(sE)}</div>
                </div>
              </div>
              {/* Pro */}
              <div className="pp-cc fc">
                <div className="pp-cpn">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0084ff", display: "inline-block" }} /> Pro
                  <span className="pp-fbdg">Primary target</span>
                </div>
                <div className="pp-cpp">₹2,499/month · 30% commission</div>
                <div className="pp-sr">
                  <span className="pp-sl">Clients</span>
                  <input type="range" min={0} max={50} step={1} value={p} onChange={e => setP(+e.target.value)} />
                  <span className="pp-sv">{p}</span>
                </div>
                <div className="pp-earn-box">
                  <div className="pp-earn-lbl">You earn / month</div>
                  <div className="pp-earn-val" style={{ color: "#0084ff" }}>{fmt(pE)}</div>
                </div>
              </div>
              {/* Growth */}
              <div className="pp-cc">
                <div className="pp-cpn">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00c853", display: "inline-block" }} /> Growth
                  <span className="pp-fbdg" style={{ background: "rgba(0,200,83,.12)", color: "#00c853" }}>Dream target</span>
                </div>
                <div className="pp-cpp">₹4,999/month · 35% commission</div>
                <div className="pp-sr">
                  <span className="pp-sl">Clients</span>
                  <input type="range" min={0} max={50} step={1} value={g} onChange={e => setG(+e.target.value)} />
                  <span className="pp-sv">{g}</span>
                </div>
                <div className="pp-earn-box">
                  <div className="pp-earn-lbl">You earn / month</div>
                  <div className="pp-earn-val" style={{ color: "#00c853" }}>{fmt(gE)}</div>
                </div>
              </div>
            </div>

            {/* TOTALS — 2 boxes only, no profit */}
            <div className="pp-tot">
              <div className="pp-tb">
                <div className="pp-tbl">Total clients referred</div>
                <div className="pp-tbn" style={{ color: "rgba(255,255,255,.88)" }}>{tot}</div>
              </div>
              <div className="pp-tb hb">
                <div className="pp-tbl">You earn / month</div>
                <div className="pp-tbn" style={{ color: "#00c853" }}>{fmt(totE)}</div>
              </div>
            </div>
            <div className="pp-nb">
              {tot === 0
                ? "Drag the sliders above to see your earnings."
                : <>With <strong style={{ color: "rgba(255,255,255,.88)" }}>{tot} clients</strong> across all plans, you earn <strong style={{ color: "#00c853" }}>{fmt(totE)}</strong>/month — <strong style={{ color: "#00c853" }}>{fmt(totE * 12)}</strong>/year.</>
              }
            </div>
          </div>

          <div className="pp-div" />

          {/* PAYOUT RULES */}
          <div className="pp-lbl">Payout rules</div>
          <div className="pp-pg pp-stg pp-rv">
            {[
              ["📅", "Monthly on the 1st", "Commissions calculated on the last day of every month, paid by the 1st via UPI."],
              ["💳", "UPI only (India-first)", "Direct to your UPI ID — GPay, PhonePe, Paytm, or bank UPI. No conversion fees."],
              ["₹", "₹500 minimum", "Below ₹500 carries over to next month. No earnings are ever lost."],
              ["♾️", "No expiry — ever", "As long as your referred client is paying, you earn. No cap. No program closed. Forever."],
            ].map(([icon, title, desc]) => (
              <div className="pp-pc" key={title as string}>
                <div className="pp-pi">{icon}</div>
                <div className="pp-pt">{title as string}</div>
                <div className="pp-pd">{desc as string}</div>
              </div>
            ))}
          </div>

          <div className="pp-div" />

          {/* HOW IT WORKS */}
          <div className="pp-lbl">How the partner program works</div>
          <div className="pp-flow pp-rv">
            {[
              ["1", "Apply on WhatsApp", "Message us with your agency name + how many AI automation clients you manage. Approval under 10 minutes."],
              ["2", "Get your referral code", "You receive a unique code (e.g. RAJAN2025). Share with any agency owner running WhatsApp AI bots."],
              ["3", "Client signs up with your code", "They enter your code at signup → get 30-day free trial (vs 14 days standard). You're linked to them forever."],
              ["4", "Client converts to paid", "When they upgrade to Starter, Pro, or Growth — your commission starts immediately from day 1."],
              ["5", "Earn every month, forever", "Commission hits your UPI on the 1st of every month. Track every client and exact earnings in real time."],
            ].map(([n, t, d]) => (
              <div className="pp-fs" key={n as string}>
                <div className="pp-fn">{n}</div>
                <div className="pp-fc2">
                  <div className="pp-ft">{t as string}</div>
                  <div className="pp-fd">{d as string}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pp-div" />

          {/* BOTTOM CTA */}
          <div className="pp-bcta pp-rv">
            <div className="pp-btag">Ready to earn ₹27,000+/month<br />without building anything?</div>
            <div className="pp-bsub">You already have the clients. Just refer them. We handle the product, support, and billing.</div>
            <a href="https://wa.me/918989568529?text=Hi, I want to join the Replora Partner Program" className="pp-wa">
              <WaIcon /> Apply to become a Partner
            </a>
          </div>

        </div>
      </section>
    </div>
  );
}
