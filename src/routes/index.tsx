import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Replora — Your AI Talks. You Watch." },
      { name: "description", content: "The world's first WhatsApp AI conversation monitoring platform." },
    ],
  }),
  component: Landing,
});

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
.rp{background:#000;color:rgba(255,255,255,.88);font-family:'DM Sans',sans-serif;overflow-x:hidden;line-height:1.6;min-height:100vh}
.rp h1,.rp h2,.rp h3,.rp h4{font-family:'Syne',sans-serif;line-height:1}
.rp-amb{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.rp-a1{position:absolute;top:-80px;left:50%;transform:translateX(-50%);width:1000px;height:650px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,132,255,.16) 0%,transparent 70%);filter:blur(50px);animation:rpa1 8s ease-in-out infinite}
.rp-a2{position:absolute;top:45%;right:-150px;width:600px;height:550px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,200,83,.09) 0%,transparent 70%);filter:blur(50px);animation:rpa2 10s ease-in-out infinite}
.rp-a3{position:absolute;bottom:5%;left:-100px;width:500px;height:400px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,132,255,.07) 0%,transparent 70%);filter:blur(50px)}
@keyframes rpa1{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-30px)}}
@keyframes rpa2{0%,100%{transform:translateY(0)}50%{transform:translateY(20px)}}
.rp-grid{position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px);background-size:80px 80px;z-index:0}
.rp nav{position:sticky;top:0;z-index:100;backdrop-filter:blur(24px);background:rgba(0,0,0,.78);border-bottom:1px solid rgba(255,255,255,.06)}
.rp-ni{max-width:1200px;margin:0 auto;padding:0 32px;height:64px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.rp-logo{display:flex;align-items:center;gap:10px;text-decoration:none}
.rp-li{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#0084ff,#00c853);display:flex;align-items:center;justify-content:center;box-shadow:0 0 22px rgba(0,132,255,.35);flex-shrink:0;transition:box-shadow .3s}
.rp-ln{font-family:'Syne',sans-serif;font-weight:700;font-size:17px;color:#fff}
.rp-nl{display:flex;gap:28px;list-style:none;align-items:center;margin:0;padding:0}
.rp-nl a{text-decoration:none;font-size:13.5px;color:rgba(255,255,255,.55);transition:color .2s}
.rp-nl a:hover{color:#fff}
.rp-pp{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;background:linear-gradient(135deg,rgba(0,200,83,.15),rgba(0,132,255,.1));border:1px solid rgba(0,200,83,.3);color:#00c853;padding:5px 13px;border-radius:999px;text-decoration:none;transition:all .25s}
.rp-pp:hover{border-color:rgba(0,200,83,.5);box-shadow:0 0 18px rgba(0,200,83,.2);color:#00c853}
.rp-dot{width:6px;height:6px;background:#00c853;border-radius:50%;animation:rpdot 2s ease-in-out infinite;flex-shrink:0}
@keyframes rpdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
.rp-nc{display:flex;align-items:center;gap:8px;flex-shrink:0}
.rp-bg{padding:0 14px;height:36px;border-radius:8px;font-size:13px;color:rgba(255,255,255,.6);background:none;border:none;text-decoration:none;display:flex;align-items:center;transition:color .2s}
.rp-bg:hover{color:#fff}
.rp-bp{padding:0 18px;height:36px;border-radius:8px;font-size:13px;font-weight:600;color:#fff;background:#0084ff;border:none;display:flex;align-items:center;gap:6px;text-decoration:none;box-shadow:0 0 18px rgba(0,132,255,.3);transition:all .2s}
.rp-bp:hover{background:#0073e0;transform:translateY(-1px)}
.rp-s{position:relative;z-index:1}
.rp-c{max-width:1200px;margin:0 auto;padding:0 32px}
.rp-ey{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#0084ff;margin-bottom:12px}
.rp-ey.gr{color:#00c853}
.rp-sh{text-align:center;margin-bottom:52px}
.rp-sh h2{font-size:clamp(30px,4.5vw,50px);font-weight:800;letter-spacing:-.03em;color:#fff}
.rp-sh h2 .dm{color:rgba(255,255,255,.3)}
.rp-sh p{font-size:15px;color:rgba(255,255,255,.42);max-width:460px;margin:14px auto 0;line-height:1.6}
.rp-hero{padding:96px 32px;text-align:center;max-width:1100px;margin:0 auto}
.rp-hb{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);backdrop-filter:blur(8px);border-radius:999px;padding:6px 16px;font-size:12px;font-weight:500;color:rgba(255,255,255,.75);margin-bottom:32px;animation:rpup .6s ease both}
.rp-hero h1{font-size:clamp(52px,8vw,94px);font-weight:800;letter-spacing:-.04em;line-height:.95;margin-bottom:28px;animation:rpup .7s .1s ease both}
.rp-l1{background:linear-gradient(135deg,#fff 40%,rgba(255,255,255,.5));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:block}
.rp-l2{background:linear-gradient(135deg,#3aa0ff,#0084ff,#00c853);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:block}
.rp-hero>p{font-size:18px;color:rgba(255,255,255,.42);max-width:560px;margin:0 auto 40px;line-height:1.65;animation:rpup .7s .2s ease both}
.rp-ha{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:64px;animation:rpup .7s .3s ease both}
.rp-bh{padding:0 28px;height:52px;border-radius:14px;font-size:15px;font-weight:700;display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-family:'DM Sans',sans-serif;transition:all .22s}
.rp-bhp{background:#0084ff;color:#fff;box-shadow:0 0 36px rgba(0,132,255,.35)}
.rp-bhp:hover{background:#0073e0;transform:translateY(-2px)}
.rp-bhg{background:rgba(255,255,255,.04);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.1)}
.rp-bhg:hover{background:rgba(255,255,255,.08);transform:translateY(-1px)}
.rp-stats{display:flex;gap:48px;justify-content:center;flex-wrap:wrap;animation:rpup .7s .4s ease both}
.rp-st{text-align:center}
.rp-sv{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#fff;transition:transform .3s}
.rp-st:hover .rp-sv{transform:scale(1.12)}
.rp-sl{font-size:11px;color:rgba(255,255,255,.3);margin-top:2px}
@keyframes rpup{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
.rp-pb{padding:80px 0;border-top:1px solid rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.04)}
.rp-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.rp-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:28px;transition:all .3s;cursor:default}
.rp-card:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.14);transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,.4)}
.rp-ce{font-size:28px;margin-bottom:16px;display:block;transition:transform .3s}
.rp-card:hover .rp-ce{transform:scale(1.15) rotate(-5deg)}
.rp-card h3{font-size:15px;font-weight:700;color:#fff;margin-bottom:8px}
.rp-card p{font-size:13px;color:rgba(255,255,255,.42);line-height:1.65}
.rp-feat{padding:96px 0}
.rp-fg{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.rp-fc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:22px;transition:all .3s;cursor:default;position:relative;overflow:hidden}
.rp-fc:hover{border-color:rgba(255,255,255,.16);transform:translateY(-5px);box-shadow:0 20px 50px rgba(0,0,0,.5)}
.rp-fi{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;transition:transform .3s}
.rp-fc:hover .rp-fi{transform:scale(1.1) rotate(-3deg)}
.rp-fc h4{font-size:13px;font-weight:700;color:#fff;margin-bottom:6px}
.rp-fc p{font-size:12px;color:rgba(255,255,255,.42);line-height:1.6}
.rp-soon{display:inline-flex;align-items:center;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;background:rgba(245,158,11,.15);color:#f59e0b;border:1px solid rgba(245,158,11,.25);border-radius:4px;padding:2px 6px;margin-bottom:8px}
.rp-why{padding:96px 0;border-top:1px solid rgba(255,255,255,.04)}
.rp-ct{border:1px solid rgba(255,255,255,.07);border-radius:20px;overflow:hidden;margin-bottom:24px}
.rp-ch{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.06)}
.rp-chc{padding:14px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.35);text-align:center}
.rp-chc.bl{color:#0084ff}
.rp-chc:first-child{text-align:left}
.rp-rb{display:inline-flex;align-items:center;gap:6px;background:rgba(0,132,255,.15);border:1px solid rgba(0,132,255,.3);border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;color:#0084ff}
.rp-cr{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s}
.rp-cr:last-child{border-bottom:none}
.rp-cr:hover{background:rgba(255,255,255,.02)}
.rp-cr:nth-child(odd){background:rgba(255,255,255,.01)}
.rp-cc{padding:12px 16px;display:flex;align-items:center;justify-content:center}
.rp-cc:first-child{justify-content:flex-start;flex-direction:column;align-items:flex-start;gap:2px}
.rp-fn{font-size:12px;color:rgba(255,255,255,.75);font-weight:500}
.rp-fnt{font-size:10px;color:rgba(255,255,255,.28)}
.rp-cy{width:24px;height:24px;border-radius:50%;background:rgba(0,200,83,.15);display:flex;align-items:center;justify-content:center}
.rp-cn2{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center}
.rp-dc{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:20px}
.rp-dcard{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:22px;display:flex;gap:16px;transition:all .3s}
.rp-dcard:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.14)}
.rp-di{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.rp-dcard h4{font-size:13px;font-weight:700;color:#fff;margin-bottom:5px}
.rp-dcard p{font-size:12px;color:rgba(255,255,255,.42);line-height:1.6}
.rp-how{padding:80px 0;border-top:1px solid rgba(255,255,255,.04)}
.rp-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.rp-step{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:24px;position:relative;transition:all .3s}
.rp-step:hover{transform:translateY(-4px);border-color:rgba(0,132,255,.25);box-shadow:0 16px 40px rgba(0,132,255,.08)}
.rp-sn{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;background:linear-gradient(135deg,#0084ff,#00c853);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:14px}
.rp-step h4{font-size:13px;font-weight:700;color:#fff;margin-bottom:6px}
.rp-step p{font-size:12px;color:rgba(255,255,255,.42);line-height:1.6}
.rp-sa{position:absolute;right:-10px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.18);z-index:2}
.rp-pricing{padding:96px 0;border-top:1px solid rgba(255,255,255,.04)}
.rp-pg{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.rp-pc{border-radius:22px;padding:28px;display:flex;flex-direction:column;position:relative;transition:all .3s}
.rp-pc:hover{transform:translateY(-6px)}
.rp-pbdg{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:#0084ff;color:#fff;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;padding:5px 16px;border-radius:999px;white-space:nowrap;box-shadow:0 0 20px rgba(0,132,255,.4)}
.rp-pn{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:rgba(255,255,255,.42);margin-bottom:10px}
.rp-pv{font-family:'Syne',sans-serif;font-size:36px;font-weight:800;color:#fff;letter-spacing:-.03em}
.rp-pp2{font-size:12px;color:rgba(255,255,255,.3);margin-top:3px;margin-bottom:20px}
.rp-pf{list-style:none;flex:1;display:flex;flex-direction:column;gap:10px;margin-bottom:24px;padding:0}
.rp-pf li{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:rgba(255,255,255,.62)}
.rp-pbt{height:44px;border-radius:10px;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;text-decoration:none;transition:all .2s;gap:6px;border:none;font-family:'DM Sans',sans-serif;width:100%}
.rp-pbt:hover{transform:translateY(-1px);filter:brightness(1.1)}
.rp-trial{margin-top:28px;border:1px solid rgba(0,200,83,.22);border-radius:22px;background:rgba(0,200,83,.05);padding:32px 40px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;position:relative;overflow:hidden;transition:all .3s}
.rp-trial::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,200,83,.4),transparent)}
.rp-trial:hover{border-color:rgba(0,200,83,.35);box-shadow:0 8px 40px rgba(0,200,83,.08)}
.rp-ttag{display:inline-flex;align-items:center;gap:6px;background:rgba(0,200,83,.12);border:1px solid rgba(0,200,83,.25);border-radius:999px;padding:4px 12px;font-size:11px;font-weight:700;color:#00c853;margin-bottom:10px}
.rp-tl h3{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;letter-spacing:-.02em;margin-bottom:6px}
.rp-tl p{font-size:13px;color:rgba(255,255,255,.42);line-height:1.5;max-width:500px}
.rp-tcs{display:flex;gap:20px;flex-wrap:wrap;margin-top:12px}
.rp-tc{display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,.55)}
.rp-bsn{padding:0 32px;height:52px;border-radius:12px;font-size:15px;font-weight:700;color:#fff;background:#00c853;border:none;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:8px;text-decoration:none;box-shadow:0 0 28px rgba(0,200,83,.3);transition:all .2s;white-space:nowrap;flex-shrink:0}
.rp-bsn:hover{background:#00b248;transform:translateY(-2px);box-shadow:0 6px 32px rgba(0,200,83,.45)}
.rp-cta{padding:96px 0}
.rp-cb{border:1px solid rgba(255,255,255,.08);border-radius:28px;background:linear-gradient(135deg,rgba(0,132,255,.1) 0%,rgba(0,0,0,0) 50%,rgba(0,200,83,.06) 100%);padding:80px 48px;text-align:center;position:relative;overflow:hidden}
.rp-cb::before{content:'';position:absolute;top:-50px;left:50%;transform:translateX(-50%);width:600px;height:280px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,132,255,.16) 0%,transparent 70%);filter:blur(30px);pointer-events:none}
.rp-cbdg{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(0,132,255,.25);background:rgba(0,132,255,.1);border-radius:999px;padding:6px 16px;font-size:12px;font-weight:500;color:#0084ff;margin-bottom:28px}
.rp-cb h2{font-size:clamp(42px,6vw,72px);font-weight:800;letter-spacing:-.04em;color:#fff;margin-bottom:18px}
.rp-cb p{font-size:16px;color:rgba(255,255,255,.42);max-width:460px;margin:0 auto 36px;line-height:1.65}
.rp-footer{border-top:1px solid rgba(255,255,255,.05);padding:56px 0;position:relative;z-index:1}
.rp-fi2{display:flex;align-items:flex-start;justify-content:space-between;gap:32px;margin-bottom:32px;flex-wrap:wrap}
.rp-fl{display:flex;gap:28px;flex-wrap:wrap}
.rp-fl a{font-size:13px;color:rgba(255,255,255,.4);text-decoration:none;transition:color .2s}
.rp-fl a:hover{color:#fff}
.rp-fb{padding-top:20px;border-top:1px solid rgba(255,255,255,.04);text-align:center}
.rp-fb span{font-size:11px;color:rgba(255,255,255,.22)}
.rp-rv{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
.rp-rv.vis{opacity:1;transform:translateY(0)}
.rp-stg>*{opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease}
.rp-stg.vis>*:nth-child(1){opacity:1;transform:none;transition-delay:.05s}
.rp-stg.vis>*:nth-child(2){opacity:1;transform:none;transition-delay:.12s}
.rp-stg.vis>*:nth-child(3){opacity:1;transform:none;transition-delay:.19s}
.rp-stg.vis>*:nth-child(4){opacity:1;transform:none;transition-delay:.26s}
.rp-stg.vis>*:nth-child(5){opacity:1;transform:none;transition-delay:.33s}
.rp-stg.vis>*:nth-child(6){opacity:1;transform:none;transition-delay:.40s}
.rp-stg.vis>*:nth-child(7){opacity:1;transform:none;transition-delay:.47s}
.rp-stg.vis>*:nth-child(8){opacity:1;transform:none;transition-delay:.54s}
@media(max-width:900px){.rp-fg,.rp-pg{grid-template-columns:repeat(2,1fr)}.rp-g3,.rp-dc,.rp-steps{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.rp-fg,.rp-pg,.rp-g3,.rp-dc,.rp-steps{grid-template-columns:1fr}.rp-nl{display:none}.rp-hero{padding:60px 20px 72px}.rp-c{padding:0 20px}.rp-trial{flex-direction:column;padding:24px}.rp-cb{padding:48px 24px}.rp-ch,.rp-cr{grid-template-columns:3fr 1fr}.rp-chc:not(:first-child):not(.bl){display:none}.rp-cr .rp-cc:not(:first-child):not(:nth-child(2)){display:none}}
`;

const compRows = [
  { f: "Built for AI agents", r: true, w: false, i: false, a: false, note: "Others built for human agents" },
  { f: "Real-time conversation monitoring", r: true, w: false, i: false, a: false, note: "They show logs, not live" },
  { f: "Hot/Warm/Cold AI lead scoring", r: true, w: false, i: false, a: false, note: "No competitor does this" },
  { f: "AI performance dashboard", r: true, w: false, i: false, a: false, note: "First in the market" },
  { f: "Webhook: n8n / Make / Zapier", r: true, w: false, i: false, a: false, note: "One key, works everywhere" },
  { f: "Multi-number support", r: true, w: true, i: true, a: false, note: null },
  { f: "Zero per-message fees", r: true, w: false, i: false, a: true, note: "WATI & Interakt charge per msg" },
];

const Chk = ({ ok }: { ok: boolean }) => ok
  ? <div className="rp-cy"><svg viewBox="0 0 24 24" fill="none" stroke="#00c853" strokeWidth="2.5" strokeLinecap="round" width="13" height="13"><polyline points="20 6 9 17 4 12" /></svg></div>
  : <div className="rp-cn2"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="2.5" strokeLinecap="round" width="11" height="11"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></div>;

const Gc = () => <svg viewBox="0 0 24 24" fill="none" stroke="#00c853" strokeWidth="2.5" width="13" height="13" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>;
const Arr = ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
const Eye = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;

function Landing() {
  if (typeof window !== "undefined") {
    setTimeout(() => {
      const obs = new IntersectionObserver((es) => { es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); obs.unobserve(e.target); } }); }, { threshold: 0.07 });
      document.querySelectorAll(".rp-rv,.rp-stg").forEach(el => obs.observe(el));
    }, 100);
  }

  return (
    <div className="rp">
      <style>{css}</style>
      <div className="rp-amb"><div className="rp-a1" /><div className="rp-a2" /><div className="rp-a3" /></div>
      <div className="rp-grid" />

      {/* NAV */}
      <nav>
        <div className="rp-ni">
          <Link to="/" className="rp-logo">
            <div className="rp-li"><Eye /></div>
            <span className="rp-ln">Replora</span>
          </Link>
          <ul className="rp-nl">
            <li><a href="#features">Features</a></li>
            <li><a href="#why">Why Replora</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><Link to="/api-docs">Docs</Link></li>
            <li><Link to="/partner" className="rp-pp"><span className="rp-dot" /> Partner Program <Arr s={11} /></Link></li>
          </ul>
          <div className="rp-nc">
            <Link to="/login" className="rp-bg">Login</Link>
            <Link to="/signup" className="rp-bp">Start Free Trial <Arr /></Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="rp-s">
        <div className="rp-hero">
          <div className="rp-hb"><span style={{ color: "#00c853" }}>✦</span> The world's first WhatsApp AI monitoring platform</div>
          <h1><span className="rp-l1">Your AI Talks.</span><span className="rp-l2">You Watch.</span></h1>
          <p>AI is running your WhatsApp. But who's watching the AI? Replora gives you complete visibility into every conversation — catch mistakes, prove ROI, never lose a hot lead.</p>
          <div className="rp-ha">
            <Link to="/signup" className="rp-bh rp-bhp">Start Monitoring Free <Arr s={16} /></Link>
            <a href="#features" className="rp-bh rp-bhg">See Features →</a>
          </div>
          <div className="rp-stats">
            {[["14", "day free trial"], ["60s", "to connect"], ["∞", "messages"], ["1", "key needed"]].map(([v, l]) => (
              <div className="rp-st" key={l}><div className="rp-sv">{v}</div><div className="rp-sl">{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* PROBLEM */}
      <div className="rp-s rp-pb">
        <div className="rp-c">
          <div className="rp-g3 rp-stg rp-rv">
            {[["🤖", "Your AI is talking 24/7", "Responding to leads, qualifying buyers, handling objections — all without you. But what happens when it says the wrong thing?"],
              ["😰", "You have zero visibility", "Every other tool shows chatbot stats. None show you the actual conversations your AI is having right now, in real time."],
              ["💸", "Hot leads die silently", "Your AI confused a hot buyer. They left. You never knew. That's not a chatbot problem — that's a monitoring problem. Replora fixes it."]
            ].map(([e, h, p]) => (
              <div className="rp-card" key={h as string}><span className="rp-ce">{e}</span><h3>{h}</h3><p>{p}</p></div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="rp-s rp-feat" id="features">
        <div className="rp-c">
          <div className="rp-sh rp-rv">
            <div className="rp-ey">Everything Built & Live</div>
            <h2>Built for AI agents.<br /><span className="dm">Not for human agents.</span></h2>
            <p>Every feature designed around how AI agents behave — built from scratch with that in mind.</p>
          </div>
          <div className="rp-fg rp-stg rp-rv">
            {[
              ["rgba(0,132,255,.12)", "#0084ff", "Live WhatsApp Inbox", "Pixel-perfect WhatsApp Web clone — every AI message in real time, inbound and outbound.", false],
              ["rgba(249,115,22,.12)", "#f97316", "Hot / Warm / Cold Tags", "AI auto-tags every contact. Hot leads surface instantly — no scrolling through 500 chats.", false],
              ["rgba(0,200,83,.12)", "#00c853", "AI Performance Dashboard", "Response rates, AI scores, sentiment and volumes in one clean dashboard.", false],
              ["rgba(139,92,246,.12)", "#8b5cf6", "Contact Profiles", "Full history per contact — messages, first/last seen, lead category. CRM built in.", false],
              ["rgba(245,158,11,.12)", "#f59e0b", "Human Alert System", "When your AI fails, Replora flags it instantly — you step in before the lead walks away.", true],
              ["rgba(0,132,255,.12)", "#0084ff", "Multi-Number Switching", "Manage multiple WhatsApp numbers from one portal. Switch like Instagram accounts.", false],
              ["rgba(0,200,83,.12)", "#00c853", "Sentiment Analysis", "Every message scored positive, neutral, or negative. See the pulse of every conversation.", false],
              ["rgba(139,92,246,.12)", "#8b5cf6", "One-Key API Security", "One wam_sk_ key. No JWT. No OAuth. Paste into any tool and you're live in 60 seconds.", false],
            ].map(([bg, ic, t, p, soon]) => (
              <div className="rp-fc" key={t as string}>
                <div className="rp-fi" style={{ background: bg as string }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={ic as string} strokeWidth="1.8" width="20" height="20" strokeLinecap="round"><circle cx="12" cy="12" r="5" /></svg>
                </div>
                {soon && <div className="rp-soon">Coming Soon</div>}
                <h4>{t as string}</h4>
                <p>{p as string}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHY */}
      <div className="rp-s rp-why" id="why">
        <div className="rp-c">
          <div className="rp-sh rp-rv">
            <div className="rp-ey gr">Why Replora</div>
            <h2>Every competitor is built<br /><span className="dm">for the wrong era.</span></h2>
            <p>WATI, Interakt, AiSensy — built when humans were agents. Replora is built for the world where <strong style={{ color: "rgba(255,255,255,.85)" }}>AI is the agent.</strong></p>
          </div>
          <div className="rp-ct rp-rv">
            <div className="rp-ch">
              <div className="rp-chc" style={{ textAlign: "left" }}>Feature</div>
              <div className="rp-chc bl"><span className="rp-rb"><Eye /> Replora</span></div>
              <div className="rp-chc">WATI</div>
              <div className="rp-chc">Interakt</div>
              <div className="rp-chc">AiSensy</div>
            </div>
            {compRows.map(row => (
              <div className="rp-cr" key={row.f}>
                <div className="rp-cc"><span className="rp-fn">{row.f}</span>{row.note && <span className="rp-fnt">{row.note}</span>}</div>
                <div className="rp-cc"><Chk ok={row.r} /></div>
                <div className="rp-cc"><Chk ok={row.w} /></div>
                <div className="rp-cc"><Chk ok={row.i} /></div>
                <div className="rp-cc"><Chk ok={row.a} /></div>
              </div>
            ))}
          </div>
          <div className="rp-dc rp-stg rp-rv">
            {[["rgba(0,132,255,.12)", "#0084ff", "First AI-native monitoring", "Every feature designed around how AI agents behave. No one else has claimed this niche."],
              ["rgba(0,200,83,.12)", "#00c853", "One key. Any tool.", "n8n, Make, Zapier, custom code — one webhook key works everywhere. No SDK needed."],
              ["rgba(245,158,11,.12)", "#f59e0b", "Flat fee. Zero markup.", "WATI charges per message. Interakt adds Meta surcharges. Replora is flat monthly. Always."],
            ].map(([bg, ic, t, p]) => (
              <div className="rp-dcard" key={t as string}>
                <div className="rp-di" style={{ background: bg as string }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={ic as string} strokeWidth="1.8" width="20" height="20" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                </div>
                <div><h4>{t as string}</h4><p>{p as string}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW */}
      <div className="rp-s rp-how">
        <div className="rp-c">
          <div className="rp-sh rp-rv"><div className="rp-ey">Setup</div><h2>Live in 60 seconds.</h2></div>
          <div className="rp-steps rp-stg rp-rv">
            {[["01", "Sign up free", "No credit card. 14-day trial. Portal ready in 30 seconds.", true],
              ["02", "Copy your API key", "One wam_sk_ from Settings. Only credential you'll ever need.", true],
              ["03", "Paste into your tool", "n8n, Make, Zapier or any HTTP request. 60 seconds flat.", true],
              ["04", "Watch every conversation", "Every AI message in your inbox. Hot leads flagged. Mistakes caught.", false],
            ].map(([n, t, p, arr]) => (
              <div className="rp-step" key={n as string}>
                <div className="rp-sn">{n}</div>
                <h4>{t as string}</h4>
                <p>{p as string}</p>
                {arr && <div className="rp-sa"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="rp-s rp-pricing" id="pricing">
        <div className="rp-c">
          <div className="rp-sh rp-rv">
            <div className="rp-ey">Pricing</div>
            <h2>Simple pricing.<br /><span className="dm">No per-message nonsense.</span></h2>
            <p>WATI charges per message. Interakt adds Meta surcharges. Replora is flat monthly. Always.</p>
          </div>
          <div className="rp-pg rp-stg rp-rv">
            <div className="rp-pc" style={{ background: "rgba(0,132,255,.1)", border: "1px solid rgba(0,132,255,.32)" }}>
              <div className="rp-pbdg">Most Popular</div>
              <div className="rp-pn">Starter</div><div className="rp-pv">₹999</div><div className="rp-pp2">per month</div>
              <ul className="rp-pf">{["3 WhatsApp numbers", "Unlimited messages", "Hot/Warm/Cold tags", "AI dashboard", "30-day retention", "Email support"].map(f => <li key={f}><Gc /> {f}</li>)}</ul>
              <Link to="/signup" className="rp-pbt" style={{ background: "#0084ff", color: "#fff", boxShadow: "0 0 20px rgba(0,132,255,.35)" }}>Get Started <Arr /></Link>
            </div>
            <div className="rp-pc" style={{ background: "rgba(0,200,83,.08)", border: "1px solid rgba(0,200,83,.25)" }}>
              <div className="rp-pn">Pro</div><div className="rp-pv">₹2,499</div><div className="rp-pp2">per month</div>
              <ul className="rp-pf">{["10 WhatsApp numbers", "Everything in Starter", "Priority WhatsApp support", "60-day retention"].map(f => <li key={f}><Gc /> {f}</li>)}</ul>
              <Link to="/signup" className="rp-pbt" style={{ background: "rgba(0,200,83,.15)", color: "rgba(255,255,255,.88)", border: "1px solid rgba(0,200,83,.3)" }}>Get Started <Arr /></Link>
            </div>
            <div className="rp-pc" style={{ background: "rgba(139,92,246,.08)", border: "1px solid rgba(139,92,246,.25)" }}>
              <div className="rp-pn">Growth</div><div className="rp-pv">₹4,999</div><div className="rp-pp2">per month</div>
              <ul className="rp-pf">{["25 WhatsApp numbers", "Everything in Pro", "PDF reports", "90-day retention"].map(f => <li key={f}><Gc /> {f}</li>)}</ul>
              <Link to="/signup" className="rp-pbt" style={{ background: "rgba(139,92,246,.15)", color: "rgba(255,255,255,.88)", border: "1px solid rgba(139,92,246,.3)" }}>Get Started <Arr /></Link>
            </div>
          </div>
          <div className="rp-trial rp-rv">
            <div className="rp-tl">
              <div className="rp-ttag">★ 14-Day Free Trial</div>
              <h3>Not sure yet? Start for free.</h3>
              <p>Full portal access — live inbox, AI dashboard, lead tags, and more. No credit card. No commitment.</p>
              <div className="rp-tcs">{["Full portal access", "No credit card", "Live in 60 seconds", "Cancel anytime"].map(c => <div className="rp-tc" key={c}><Gc /> {c}</div>)}</div>
            </div>
            <Link to="/signup" className="rp-bsn">Start Now <Arr s={16} /></Link>
          </div>
          <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,.22)", marginTop: "20px" }}>All plans · Payments via Razorpay · +₹499/extra number · Cancel anytime</p>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="rp-s rp-cta">
        <div className="rp-c">
          <div className="rp-cb rp-rv">
            <div className="rp-cbdg">✦ Your AI is talking right now</div>
            <h2>Are you<br />watching?</h2>
            <p>Start your free 14-day trial. No credit card. Watch your first AI conversation go live in under 2 minutes.</p>
            <Link to="/signup" className="rp-bh rp-bhp" style={{ fontSize: "16px", height: "56px", padding: "0 36px", borderRadius: "16px" }}>Start Monitoring Free <Arr s={18} /></Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="rp-footer">
        <div className="rp-c">
          <div className="rp-fi2">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="rp-li" style={{ width: "34px", height: "34px", borderRadius: "9px" }}><Eye /></div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "15px", color: "#fff" }}>Replora</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,.3)" }}>Your AI talks. You watch.</div>
              </div>
            </div>
            <div className="rp-fl">
              <a href="#features">Features</a>
              <a href="#why">Why Replora</a>
              <a href="#pricing">Pricing</a>
              <Link to="/api-docs">API Docs</Link>
              <Link to="/login">Login</Link>
              <Link to="/signup">Sign Up</Link>
              <Link to="/partner" style={{ color: "#00c853" }}>Partner Program</Link>
            </div>
          </div>
          <div className="rp-fb"><span>© Replora 2026. All rights reserved.</span></div>
        </div>
      </footer>
    </div>
  );
}
