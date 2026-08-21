import { useEffect } from 'react'

/* ─── Inline SVG icons (no extra dependency) ──────────────────────────────── */
function IconUser({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function IconAlert({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function IconGlobe({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
function IconNetwork({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="16" y="16" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="9" y="2" width="6" height="6" rx="1" /><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" /><path d="M12 12V8" />
    </svg>
  )
}
function IconFileText({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" />
    </svg>
  )
}
function IconShield({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

const DARK = '#0A1628'
const ACCENT = '#00D68F'
const BRAND_FROM = '#FF4C1D'
const BRAND_TO = '#9B0063'
const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_FROM}, ${BRAND_TO})`

/* ─── Scroll-fade observer ─────────────────────────────────────────────────── */
function useFadeUp() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('lg-visible')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )
    document.querySelectorAll('.lg-fade').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ─── Hero Network Graph SVG ───────────────────────────────────────────────── */
function HeroGraph() {
  return (
    <svg
      viewBox="0 0 640 400"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      role="img"
      aria-label="Network graph visualising verified identities connected by shared attributes. Five central nodes highlighted in red represent a coordinated identity ring — sharing a device and address — surrounded by amber identities under review and green identities verified independent."
    >
      <defs>
        <filter id="hg-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Edges: ring → hub ── */}
      <line x1="175" y1="120" x2="317" y2="198" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.45" />
      <line x1="465" y1="120" x2="323" y2="198" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.45" />
      <line x1="150" y1="292" x2="315" y2="208" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.45" />
      <line x1="490" y1="292" x2="325" y2="208" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.45" />

      {/* ── Edges: feeder → ring ── */}
      <line x1="82"  y1="185" x2="172" y2="122" stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.3" />
      <line x1="82"  y1="185" x2="152" y2="290" stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.3" />
      <line x1="558" y1="185" x2="463" y2="122" stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.3" />
      <line x1="558" y1="185" x2="488" y2="290" stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.3" />
      <line x1="232" y1="362" x2="152" y2="295" stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.3" />
      <line x1="408" y1="362" x2="488" y2="295" stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.3" />

      {/* ── Edges: entry → feeder ── */}
      <line x1="62"  y1="72"  x2="80"  y2="182" stroke="#4B5563" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="578" y1="72"  x2="556" y2="182" stroke="#4B5563" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="320" y1="48"  x2="175" y2="118" stroke="#4B5563" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="320" y1="48"  x2="465" y2="118" stroke="#4B5563" strokeWidth="1" strokeOpacity="0.4" />

      {/* ── Dashed cross-ring ── */}
      <line x1="175" y1="120" x2="465" y2="120" stroke="#4B5563" strokeWidth="0.8" strokeOpacity="0.22" strokeDasharray="4,5" />
      <line x1="150" y1="292" x2="490" y2="292" stroke="#4B5563" strokeWidth="0.8" strokeOpacity="0.22" strokeDasharray="4,5" />

      {/* ── Pulsing halos on HIGH nodes ── */}
      <circle cx="320" cy="205" r="28" fill="none" stroke="#EF4444" strokeWidth="1.5" className="lg-halo-1" />
      <circle cx="175" cy="120" r="19" fill="none" stroke="#EF4444" strokeWidth="1"   className="lg-halo-2" />
      <circle cx="465" cy="120" r="19" fill="none" stroke="#EF4444" strokeWidth="1"   className="lg-halo-3" />
      <circle cx="150" cy="292" r="19" fill="none" stroke="#EF4444" strokeWidth="1"   className="lg-halo-4" />
      <circle cx="490" cy="292" r="19" fill="none" stroke="#EF4444" strokeWidth="1"   className="lg-halo-5" />

      {/* ── LOW risk nodes (green) ── */}
      <circle cx="62"  cy="72"  r="8" fill="#22C55E22" stroke="#22C55E" strokeWidth="2" />
      <circle cx="578" cy="72"  r="8" fill="#22C55E22" stroke="#22C55E" strokeWidth="2" />
      <circle cx="320" cy="48"  r="8" fill="#22C55E22" stroke="#22C55E" strokeWidth="2" />

      {/* ── MEDIUM risk nodes (amber) ── */}
      <circle cx="82"  cy="185" r="9" fill="#F59E0B22" stroke="#F59E0B" strokeWidth="2" />
      <circle cx="558" cy="185" r="9" fill="#F59E0B22" stroke="#F59E0B" strokeWidth="2" />
      <circle cx="232" cy="362" r="9" fill="#F59E0B22" stroke="#F59E0B" strokeWidth="2" />
      <circle cx="408" cy="362" r="9" fill="#F59E0B22" stroke="#F59E0B" strokeWidth="2" />

      {/* ── HIGH risk ring nodes (red, glowing) ── */}
      <circle cx="175" cy="120" r="10" fill="#EF444422" stroke="#EF4444" strokeWidth="2"   filter="url(#hg-glow)" />
      <circle cx="465" cy="120" r="10" fill="#EF444422" stroke="#EF4444" strokeWidth="2"   filter="url(#hg-glow)" />
      <circle cx="150" cy="292" r="10" fill="#EF444422" stroke="#EF4444" strokeWidth="2"   filter="url(#hg-glow)" />
      <circle cx="490" cy="292" r="10" fill="#EF444422" stroke="#EF4444" strokeWidth="2"   filter="url(#hg-glow)" />

      {/* ── Hub: POS beneficiary (largest, most prominent) ── */}
      <circle cx="320" cy="205" r="15" fill="#EF444433" stroke="#EF4444" strokeWidth="2.5" filter="url(#hg-glow)" />
    </svg>
  )
}

/* ─── Deployment Architecture Diagram SVG ─────────────────────────────────── */
function DeploymentDiagram() {
  return (
    <svg
      viewBox="0 0 420 300"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm mx-auto lg:max-w-none"
      role="img"
      aria-label="TARA deployment architecture diagram showing the TARA Engine, an in-memory identity graph, and a PostgreSQL identity store inside your infrastructure boundary. QoreID verification flows in from outside; trust verdicts flow out to a human reviewer."
    >
      <defs>
        <marker id="dd-arr-g" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,1 L6,3.5 L0,6 Z" fill={ACCENT} />
        </marker>
        <marker id="dd-arr-gray" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,1 L6,3.5 L0,6 Z" fill="#9CA3AF" />
        </marker>
      </defs>

      {/* Outer boundary */}
      <rect x="18" y="22" width="310" height="242" rx="10" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="7,4" />
      <text x="173" y="16" textAnchor="middle" fontSize="9.5" fill="#9CA3AF" fontFamily="DM Sans, sans-serif" letterSpacing="1.5">YOUR INFRASTRUCTURE</text>

      {/* TARA Engine box */}
      <rect x="44" y="46" width="258" height="56" rx="6" fill="#F0FFF8" stroke={ACCENT} strokeWidth="1.5" />
      <text x="173" y="68" textAnchor="middle" fontSize="12" fill={DARK} fontFamily="Space Grotesk, DM Sans, sans-serif" fontWeight="700">TARA Engine</text>
      <text x="173" y="86" textAnchor="middle" fontSize="9" fill="#6B7280" fontFamily="DM Sans, sans-serif">FastAPI  ·  In-Memory Graph  ·  Detection Patterns</text>

      {/* Connector tree */}
      <line x1="173" y1="102" x2="173" y2="130" stroke="#D1D5DB" strokeWidth="1.5" />
      <line x1="92"  y1="130" x2="254" y2="130" stroke="#D1D5DB" strokeWidth="1.5" />
      <line x1="92"  y1="130" x2="92"  y2="148" stroke="#D1D5DB" strokeWidth="1.5" />
      <line x1="254" y1="130" x2="254" y2="148" stroke="#D1D5DB" strokeWidth="1.5" />

      {/* Identity graph */}
      <rect x="34"  y="148" width="116" height="52" rx="6" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
      <text x="92"  y="170" textAnchor="middle" fontSize="10" fill="#111827" fontFamily="DM Sans, sans-serif" fontWeight="600">Identity Graph</text>
      <text x="92"  y="186" textAnchor="middle" fontSize="8.5" fill="#6B7280" fontFamily="DM Sans, sans-serif">Shared-attribute edges</text>

      {/* PostgreSQL */}
      <rect x="196" y="148" width="116" height="52" rx="6" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
      <text x="254" y="170" textAnchor="middle" fontSize="10" fill="#111827" fontFamily="DM Sans, sans-serif" fontWeight="600">PostgreSQL</text>
      <text x="254" y="186" textAnchor="middle" fontSize="8.5" fill="#6B7280" fontFamily="DM Sans, sans-serif">Identities · Relationships</text>

      {/* Verification input (from right) */}
      <text x="375" y="68" textAnchor="middle" fontSize="9" fill="#9CA3AF" fontFamily="DM Sans, sans-serif">QoreID Verification</text>
      <line x1="375" y1="73" x2="375" y2="84" stroke="#9CA3AF" strokeWidth="1.2" />
      <line x1="375" y1="84" x2="305" y2="70" stroke="#9CA3AF" strokeWidth="1.2" markerEnd="url(#dd-arr-gray)" />

      {/* Trust verdict → human reviewer */}
      <line x1="92" y1="200" x2="92" y2="240" stroke={ACCENT} strokeWidth="1.5" />
      <line x1="92" y1="240" x2="170" y2="260" stroke={ACCENT} strokeWidth="1.5" markerEnd="url(#dd-arr-g)" />

      <rect x="172" y="248" width="56" height="26" rx="5" fill="#ECFDF5" stroke={ACCENT} strokeWidth="1.5" />
      <text x="200" y="265" textAnchor="middle" fontSize="9" fill={ACCENT} fontFamily="DM Sans, sans-serif" fontWeight="700">Reviewer</text>

      <text x="105" y="258" fontSize="8.5" fill={ACCENT} fontFamily="DM Sans, sans-serif">Trust Verdict →</text>
    </svg>
  )
}


/* ─── Nav ──────────────────────────────────────────────────────────────────── */
function Nav() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/10"
      style={{ background: DARK }}
    >
      {/* Brand accent top strip */}
      <div style={{ height: '2px', background: BRAND_GRADIENT }} />
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-y-3">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 no-underline">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill={BRAND_FROM} fillOpacity="0.15" />
            <circle cx="16" cy="10" r="3" fill={BRAND_FROM} />
            <circle cx="8"  cy="24" r="3" fill={BRAND_TO} fillOpacity="0.9" />
            <circle cx="24" cy="24" r="3" fill={BRAND_TO} fillOpacity="0.9" />
            <line x1="16" y1="13" x2="8"  y2="21" stroke={BRAND_FROM} strokeWidth="1.5" strokeOpacity="0.6" />
            <line x1="16" y1="13" x2="24" y2="21" stroke={BRAND_FROM} strokeWidth="1.5" strokeOpacity="0.6" />
            <line x1="8"  y1="24" x2="24" y2="24" stroke={BRAND_TO} strokeWidth="1.5" strokeOpacity="0.3" />
          </svg>
          <span
            className="text-white text-lg font-display tracking-wide"
            style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", fontWeight: 700 }}
          >
            TA<span style={{ background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>RA</span>
          </span>
        </a>

        {/* Links + CTA */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <button onClick={() => scrollTo('how-it-works')} className="text-sm text-[#94A3B8] hover:text-white transition-colors bg-transparent border-0 cursor-pointer">How It Works</button>
          <button onClick={() => scrollTo('what-it-detects')}  className="text-sm text-[#94A3B8] hover:text-white transition-colors bg-transparent border-0 cursor-pointer">What It Detects</button>
          <a href="mailto:damilareodebiyi3@gmail.com"       className="text-sm text-[#94A3B8] hover:text-white transition-colors no-underline">Contact</a>
          {/* Track badge */}
          <div className="hidden sm:flex items-center gap-2 border border-white/10 rounded-full px-3 py-1">
            <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>TiT 6.0 · QoreID Track</span>
          </div>
          <a
            href="/dashboard"
            className="px-5 py-2 rounded-lg text-sm font-semibold no-underline transition-opacity hover:opacity-90"
            style={{ background: BRAND_GRADIENT, color: '#fff' }}
          >
            Open Dashboard →
          </a>
        </div>
      </div>
    </nav>
  )
}

/* ─── Main export ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  useFadeUp()

  return (
    <div style={{ background: DARK, color: '#F7F9FC' }}>
      <Nav />

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2 — HERO
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: DARK, paddingTop: '96px', paddingBottom: '96px' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: copy */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
                  style={{ background: `${BRAND_FROM}18`, border: `1px solid ${BRAND_FROM}35`, color: '#FF8560' }}
                >
                  TiT 6.0 · Digital Identity & Trust
                </div>
              </div>

              <h1
                className="font-display mb-6"
                style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", fontWeight: 700, fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', lineHeight: 1.1, color: '#FFFFFF', letterSpacing: '-0.02em' }}
              >
                QoreID proves who they are.{' '}
                <span style={{ background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>TARA reveals who they're connected to.</span>
              </h1>

              <p
                className="mb-4"
                style={{ fontSize: '1.15rem', fontWeight: 500, color: '#CBD5E1', lineHeight: 1.55 }}
              >
                A network-layer trust check for identities that have already passed verification.
              </p>

              <p
                className="mb-10"
                style={{ fontSize: '1rem', color: '#94A3B8', lineHeight: 1.7, maxWidth: '480px' }}
              >
                Every identity TARA sees has already passed real verification through QoreID — that's the premise, not a caveat. TARA maps the attributes verified identities share — device, address, employer, the window they signed up in — to surface coordinated rings where every single member is, individually, a real, verified person.
              </p>

              <a
                href="/dashboard"
                className="inline-block px-8 py-4 rounded-lg font-semibold text-base no-underline transition-opacity hover:opacity-90"
                style={{ background: BRAND_GRADIENT, color: '#fff', boxShadow: `0 0 24px ${BRAND_FROM}40` }}
              >
                Explore the Live Demo →
              </a>
            </div>

            {/* Right: SVG graph */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: '#060E1E', border: '1px solid #1E3358', aspectRatio: '16/10' }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5 border-b"
                style={{ borderColor: '#1E3358' }}
              >
                <span className="w-2 h-2 rounded-full bg-red-500/70" />
                <span className="w-2 h-2 rounded-full bg-amber-500/70" />
                <span className="w-2 h-2 rounded-full bg-green-500/70" />
                <span
                  className="ml-2 text-[10px] font-mono"
                  style={{ color: '#4B6B8A' }}
                >
                  graph-explorer · verdict-view · live
                </span>
              </div>
              <div style={{ padding: '8px 12px 12px' }}>
                <HeroGraph />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 3 — THE PROBLEM
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="max-w-[1200px] mx-auto px-6">

          <div className="lg-fade mb-16" style={{ maxWidth: '680px' }}>
            <h2
              className="font-display mb-5"
              style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 1.15, color: DARK, letterSpacing: '-0.02em' }}
            >
              8 identities. Each one verified. All sharing the same device. Verification sees nothing wrong — because nothing is.
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#4B5563', lineHeight: 1.7 }}>
              Identity verification checks one person against one record. It was never built to notice that eight different verified people share a device, an address, and an onboarding window. The fraud isn't in any single record — it's in the relationship between records.
            </p>
          </div>

          {/* Three problem cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: <IconUser className="w-5 h-5" style={{ color: DARK }} />,
                title: 'One check, one record',
                body: 'QoreID confirms a name matches a BVN — nothing more. It was never designed to notice that the same device just verified seven other "different" people this week.',
                delay: '0ms',
              },
              {
                icon: <IconAlert className="w-5 h-5" style={{ color: DARK }} />,
                title: 'The whole ring passes',
                body: 'A loan-stacking ring isn’t eight fake identities. It’s eight real, verifiable people sharing one address and one payday. Every individual check comes back clean, because every individual person is who they say they are.',
                delay: '80ms',
              },
              {
                icon: <IconGlobe className="w-5 h-5" style={{ color: DARK }} />,
                title: 'A gap by design, not a flaw',
                body: 'QoreID answers one question: is this person real? Nobody built the layer that asks the second question — are they acting alone. That’s the gap TARA closes.',
                delay: '160ms',
              },
            ].map(({ icon, title, body, delay }) => (
              <div
                key={title}
                className="lg-fade rounded-xl p-7"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', transitionDelay: delay }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                  style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}30` }}
                >
                  {icon}
                </div>
                <h3
                  className="font-semibold mb-3"
                  style={{ fontSize: '1rem', color: DARK, fontFamily: "'DM Sans', sans-serif" }}
                >
                  {title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.7 }}>{body}</p>
              </div>
            ))}
          </div>

          {/* Full-width image — 711×402, display at 16:9, object-cover */}
          <div className="lg-fade w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <img
              src="/nigeria-banking-scene.jpg"
              alt="Nigerian bank branch with customers at counters and tellers at work — real Nigerian financial daily life"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 4 — HOW IT WORKS
      ════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ background: DARK, paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="max-w-[1200px] mx-auto px-6">

          <div className="lg-fade text-center mb-16" style={{ maxWidth: '560px', margin: '0 auto 64px' }}>
            <h2
              className="font-display mb-4"
              style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 1.15, color: '#FFFFFF', letterSpacing: '-0.02em' }}
            >
              From verification to trust verdict in five steps.
            </h2>
          </div>

          {/* Pipeline */}
          <div className="lg-fade grid grid-cols-2 md:grid-cols-5 gap-px rounded-xl overflow-hidden mb-16" style={{ border: '1px solid #1E3358', background: '#1E3358' }}>
            {[
              { n: '01', title: 'Verify via QoreID',  desc: 'An identity is submitted with a BVN and core details. QoreID verifies it belongs to a real, matched person — that result is the input everything else depends on.' },
              { n: '02', title: 'Enter the Graph', desc: 'A verified identity becomes a node in TARA’s live relationship graph, carrying its device, address, employer, and onboarding timestamp.' },
              { n: '03', title: 'Check Shared Attributes',   desc: 'Every new node is compared against the existing graph for device, address, and employer overlap, plus name-similarity and onboarding-window checks.' },
              { n: '04', title: 'Compute a Trust Verdict',  desc: 'Identities caught in a flagged pattern get a trust score and a plain-English evidence list — exactly which attributes they share, and with how many others.' },
              { n: '05', title: 'Human Reviews, Always',  desc: 'The verdict is Approve, Review, or Needs Review — never a hard reject. A flagged cluster goes to a human with the full evidence attached.' },
            ].map(({ n, title, desc }) => (
              <div
                key={n}
                className="flex flex-col p-6 md:p-7"
                style={{ background: '#0D1B2E' }}
              >
                <span
                  className="font-mono font-semibold text-sm mb-4 block"
                  style={{ background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  {n}
                </span>
                <h3 className="font-semibold text-white mb-2" style={{ fontSize: '0.95rem' }}>
                  {title}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Below pipeline: text + image */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="lg-fade">
              <h3
                className="font-display mb-5"
                style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: '#FFFFFF', letterSpacing: '-0.01em' }}
              >
                How the graph model works
              </h3>
              <p className="mb-4" style={{ fontSize: '0.95rem', color: '#94A3B8', lineHeight: 1.75 }}>
                Every verified identity is a <strong style={{ color: '#CBD5E1' }}>node</strong>. Every attribute two identities have in common — the same device, the same address, the same employer — is an <strong style={{ color: '#CBD5E1' }}>edge</strong> between them. TARA doesn't just store identities side by side; it maps how they relate.
              </p>
              <p className="mb-4" style={{ fontSize: '0.95rem', color: '#94A3B8', lineHeight: 1.75 }}>
                Three detection patterns run against that graph: clusters of identities sharing an attribute at a suspicious scale, identities whose names are near-duplicates of another verified identity in the same context, and groups of identities all verified inside the same tight time window on the same device.
              </p>
              <p style={{ fontSize: '0.95rem', color: '#94A3B8', lineHeight: 1.75 }}>
                When a pattern fires, TARA doesn't quietly log it — it attaches the evidence directly to the identity's trust verdict, in plain language, so whoever reviews it can see exactly why.
              </p>
            </div>
            <div className="lg-fade flex items-center justify-center">
              {/* Image is 288×175 — displayed in a framed card, no upscaling */}
              <div
                className="rounded-xl overflow-hidden w-full"
                style={{ background: '#0D1B2E', border: '1px solid #1E3358', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}
              >
                <img
                  src="/compliance-officer-screen.jpg"
                  alt="Compliance officer reviewing financial risk data on screen in a Nigerian fintech office"
                  style={{ maxWidth: '100%', width: '288px', height: 'auto', borderRadius: '8px', display: 'block' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 5 — WHY NIGERIA
      ════════════════════════════════════════════════════════════════════ */}
      <section id="what-it-detects" style={{ background: '#FFFFFF', paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="max-w-[1200px] mx-auto px-6">

          <div className="lg-fade mb-14" style={{ maxWidth: '680px' }}>
            <h2
              className="font-display mb-5"
              style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 1.15, color: DARK, letterSpacing: '-0.02em' }}
            >
              Three ways a fraud ring shows up in a graph of individually verified people.
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#4B5563', lineHeight: 1.7 }}>
              Loan-stacking rings and mule identity farms are active, documented fraud patterns — and every account holder in them passes identity verification individually. The group behavior is the signal verification alone was never going to catch.
            </p>
          </div>

          {/* Image is 275×183 (3:2 landscape) — spans full width above the cards */}
          <div className="lg-fade mb-10 w-full rounded-xl overflow-hidden" style={{ aspectRatio: '3/2', maxHeight: '380px' }}>
            <img
              src="/lagos-fintech-workspace.jpg"
              alt="Modern Lagos fintech workspace — young professionals at workstations in a Nigerian tech company office"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Three-pattern grid — full width now that image is above */}
          <div className="grid sm:grid-cols-3 gap-5">
              {[
                {
                  title: 'Shared-Attribute Clusters',
                  body: 'Multiple verified identities sharing the same device fingerprint, home address, or employer, in numbers that stop looking like coincidence. Two flatmates sharing an address is normal. Eight "unrelated" identities sharing one is a ring.',
                  delay: '0ms',
                },
                {
                  title: 'Identity Fragmentation',
                  body: 'The same person re-verifying under slightly different spellings of their own name — "Adaeze Nwankwo" and "Adaeze N. Nwankwo" — while sharing the same address or phone number. One person, multiple verified identities.',
                  delay: '80ms',
                },
                {
                  title: 'Coordinated Onboarding',
                  body: 'A batch of identities all completing verification within the same tight window, on the same device or referral link. Real people don\'t all sign up for the same product within hours of each other by accident.',
                  delay: '160ms',
                },
              ].map(({ title, body, delay }) => (
                <div
                  key={title}
                  className="lg-fade rounded-xl p-6"
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', transitionDelay: delay }}
                >
                  <div
                    className="w-1 h-6 rounded-full mb-4"
                    style={{ background: ACCENT }}
                  />
                  <h3
                    className="font-semibold mb-3"
                    style={{ fontSize: '0.975rem', color: DARK, fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.7 }}>{body}</p>
                </div>
              ))}
            </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 6 — THE PRODUCT
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: DARK, paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="max-w-[1200px] mx-auto px-6">

          <div className="lg-fade mb-10" style={{ maxWidth: '620px' }}>
            <h2
              className="font-display mb-4"
              style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 1.15, color: '#FFFFFF', letterSpacing: '-0.02em' }}
            >
              Loan stacking and mule identity farms aren't hypothetical.
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#94A3B8', lineHeight: 1.7 }}>
              They're documented, active fraud patterns in Nigerian lending and onboarding — and they work specifically because every individual account holder is a real, verifiable person. TARA is the layer that catches the group behavior, not a fake ID.
            </p>
          </div>

          <div
            className="lg-fade inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mb-10"
            style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, color: '#6EE7B7' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1L1 4v3c0 3.31 2.58 6.41 6 7.16C10.42 13.41 13 10.31 13 7V4L7 1z" stroke={ACCENT} strokeWidth="1.5" fill="none" />
              <path d="M4.5 7l2 2 3-3" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Nothing is ever auto-rejected — every flagged cluster goes to human review with full evidence attached
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: <IconNetwork className="w-6 h-6" style={{ color: BRAND_FROM }} />,
                title: 'Live Relationship Graph',
                body: 'Every verified identity mapped in real time, with the shared attributes connecting it to others visible at a glance — not buried in a database query.',
                delay: '0ms',
              },
              {
                icon: <IconFileText className="w-6 h-6" style={{ color: BRAND_FROM }} />,
                title: 'Plain-English Evidence',
                body: 'Every flagged identity comes with the exact reason: which attribute, which value, how many other identities share it. Nothing to interpret, nothing to take on faith.',
                delay: '80ms',
              },
              {
                icon: <IconShield className="w-6 h-6" style={{ color: BRAND_FROM }} />,
                title: 'Human-Reviewed, Never Auto-Rejected',
                body: 'The highest-confidence verdict TARA produces is "needs review," not "reject." A shared address between flatmates isn\'t fraud — a person decides, with the full picture in front of them.',
                delay: '160ms',
              },
            ].map(({ icon, title, body, delay }) => (
              <div
                key={title}
                className="lg-fade rounded-xl p-7"
                style={{ background: '#0D1B2E', border: '1px solid #1E3358', transitionDelay: delay }}
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center mb-6"
                  style={{ background: `${BRAND_FROM}18`, border: `1px solid ${BRAND_FROM}30` }}
                >
                  {icon}
                </div>
                <h3
                  className="font-semibold mb-3 text-white"
                  style={{ fontSize: '1rem', fontFamily: "'DM Sans', sans-serif" }}
                >
                  {title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.75 }}>{body}</p>
              </div>
            ))}
          </div>

          {/* Full-width image — 1024×540, display at natural 1024:540 ratio */}
          <div className="lg-fade w-full rounded-xl overflow-hidden" style={{ aspectRatio: '1024/540' }}>
            <img
              src="/nigerian-compliance-team.jpg"
              alt="Nigerian compliance and risk team collaborating around a table reviewing data and reports"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 7 — DEPLOYMENT
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="max-w-[1200px] mx-auto px-6">

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <div className="lg-fade">
              <h2
                className="font-display mb-6"
                style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 1.15, color: DARK, letterSpacing: '-0.02em' }}
              >
                Your data never leaves your walls.
              </h2>
              <p className="mb-5" style={{ fontSize: '1rem', color: '#4B5563', lineHeight: 1.75 }}>
                TARA deploys inside your own infrastructure — your cloud tenant, your private server, or a dedicated instance we manage. Identity data never leaves your environment. Verification runs through QoreID; everything after that — the graph, the detection, the verdict — stays inside your walls.
              </p>
              <p className="mb-5" style={{ fontSize: '1rem', color: '#4B5563', lineHeight: 1.75 }}>
                We provide the software. You keep the keys.
              </p>
              <p className="mb-10" style={{ fontSize: '1rem', color: '#4B5563', lineHeight: 1.75 }}>
                The identity graph and the durable identity store run on your compute. A trust verdict — Approve, Review, or Needs Review — is the only output, and it never leaves the review screen without a human decision.
              </p>
              <p className="mb-10" style={{ fontSize: '1rem', color: '#4B5563', lineHeight: 1.75 }}>
                Identities are verified through QoreID's API and enter the graph immediately. Nothing about how an identity got verified — or who reviewed the verdict — leaves your infrastructure.
              </p>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, color: '#065F46' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M7 1L1 4v3c0 3.31 2.58 6.41 6 7.16C10.42 13.41 13 10.31 13 7V4L7 1z" stroke="#00D68F" strokeWidth="1.5" fill="none" />
                  <path d="M4.5 7l2 2 3-3" stroke="#00D68F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                NDPA-aligned by design — purpose-limited to fraud prevention
              </div>
            </div>

            {/* Right: deployment diagram */}
            <div className="lg-fade flex items-center justify-center">
              <DeploymentDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 8 — CTA
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: DARK, paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="lg-fade" style={{ maxWidth: '680px', margin: '0 auto' }}>
            <h2
              className="font-display mb-5"
              style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', lineHeight: 1.15, color: '#FFFFFF', letterSpacing: '-0.02em' }}
            >
              They're verified.<br />TARA shows you if they're alone.<br />You make the call.
            </h2>
            <p className="mb-10" style={{ fontSize: '1.05rem', color: '#94A3B8', lineHeight: 1.65 }}>
              Built for any platform onboarding users — lenders, fintechs, marketplaces — who need more than a verification checkmark.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-10 py-4 rounded-lg font-semibold text-base no-underline transition-opacity hover:opacity-90"
              style={{ background: BRAND_GRADIENT, color: '#fff', fontSize: '1rem', boxShadow: `0 0 32px ${BRAND_FROM}40` }}
            >
              Open the Live Dashboard →
            </a>
            <p className="mt-6" style={{ fontSize: '0.85rem', color: '#475569' }}>
              No login required. The full pipeline is live — QoreID verification, graph detection, trust verdicts. See it run.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 9 — FOOTER
      ════════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: DARK, borderTop: '1px solid #1E3358', paddingTop: '48px', paddingBottom: '48px' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-10 mb-10">
            {/* Logo + tagline */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect width="32" height="32" rx="7" fill={BRAND_FROM} fillOpacity="0.15" />
                  <circle cx="16" cy="10" r="3" fill={BRAND_FROM} />
                  <circle cx="8"  cy="24" r="3" fill={BRAND_TO} fillOpacity="0.9" />
                  <circle cx="24" cy="24" r="3" fill={BRAND_TO} fillOpacity="0.9" />
                  <line x1="16" y1="13" x2="8"  y2="21" stroke={BRAND_FROM} strokeWidth="1.5" strokeOpacity="0.6" />
                  <line x1="16" y1="13" x2="24" y2="21" stroke={BRAND_FROM} strokeWidth="1.5" strokeOpacity="0.6" />
                  <line x1="8"  y1="24" x2="24" y2="24" stroke={BRAND_TO} strokeWidth="1.5" strokeOpacity="0.3" />
                </svg>
                <span
                  style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#FFFFFF' }}
                >
                  TA<span style={{ background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>RA</span>
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.65 }}>
                TARA — Trust And Relationship Analysis. The network layer on top of QoreID verification.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-3">
              <p style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Navigation</p>
              <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-sm bg-transparent border-0 cursor-pointer" style={{ color: '#64748B' }}>How It Works</button>
              <button onClick={() => document.getElementById('what-it-detects')?.scrollIntoView({ behavior: 'smooth' })}  className="text-left text-sm bg-transparent border-0 cursor-pointer" style={{ color: '#64748B' }}>What It Detects</button>
              <a href="/dashboard" className="text-sm no-underline" style={{ color: '#64748B' }}>Open Dashboard</a>
            </div>

            {/* Recognition */}
            <div>
              <p style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Built for</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#FF6B3D', fontWeight: 600 }}>TiT 6.0 · QoreID Track</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.65 }}>
                Digital Identity & Trust
              </p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1E3358', paddingTop: '24px' }}>
            <p style={{ fontSize: '0.8rem', color: '#374151' }}>
              © 2026 TARA — Team Overclock. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
