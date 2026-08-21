import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const stats = [
  { value: '$9.1B', label: 'Lost to financial crime annually in Nigeria' },
  { value: '95%', label: 'False positive rate in legacy AML systems' },
  { value: '900+', label: 'MFBs with no AML graph intelligence' },
]

const steps = [
  { n: '01', title: 'Ingest', desc: 'Bank transaction data ingested via secure API' },
  { n: '02', title: 'Resolve', desc: 'Entity resolution across BVN, NIN, account numbers' },
  { n: '03', title: 'Model', desc: 'Graph neural network builds financial relationship map' },
  { n: '04', title: 'Detect', desc: 'AML pattern detection: rings, webs, layered chains' },
  { n: '05', title: 'Report', desc: 'NFIU-compliant STR auto-generated via LLM' },
]

const features = [
  { title: 'Graph Intelligence', desc: 'Force-directed network visualization of all financial relationships' },
  { title: 'AML Pattern Detection', desc: 'POS rings, shell webs, and layered transfer chains detected automatically' },
  { title: 'AI-Generated STRs', desc: 'NFIU-compliant reports drafted by llama-3.3-70b in seconds' },
  { title: 'Entity 360° View', desc: 'Full profile: BVN, NIN, risk score, transaction history, linked alerts' },
  { title: 'Immutable Audit Trail', desc: 'SHA-256 hashed log of every action for regulatory review' },
  { title: 'Real-time Alerts', desc: 'Instant notification when suspicious patterns are detected' },
]

function MiniGraph() {
  const svgRef = useRef(null)

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const w = el.clientWidth || 600
    const h = 300

    d3.select(el).selectAll('*').remove()

    const nodes = [
      { id: 'A', risk: 'HIGH' }, { id: 'B', risk: 'HIGH' }, { id: 'C', risk: 'MEDIUM' },
      { id: 'D', risk: 'HIGH' }, { id: 'E', risk: 'LOW' }, { id: 'F', risk: 'MEDIUM' },
      { id: 'G', risk: 'LOW' }, { id: 'H', risk: 'HIGH' },
    ]
    const links = [
      { source: 'A', target: 'B' }, { source: 'B', target: 'C' }, { source: 'C', target: 'D' },
      { source: 'D', target: 'A' }, { source: 'A', target: 'E' }, { source: 'B', target: 'F' },
      { source: 'F', target: 'G' }, { source: 'G', target: 'H' }, { source: 'H', target: 'B' },
    ]
    const colors = { HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#22C55E' }

    const svg = d3.select(el).attr('width', w).attr('height', h)
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'lglow')
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur')
    const fm = filter.append('feMerge')
    fm.append('feMergeNode').attr('in', 'coloredBlur')
    fm.append('feMergeNode').attr('in', 'SourceGraphic')

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(w / 2, h / 2))

    const link = svg.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', '#2D3748').attr('stroke-width', 1.5).attr('stroke-opacity', 0.5)

    const node = svg.append('g').selectAll('circle').data(nodes).join('circle')
      .attr('r', 10)
      .attr('fill', (d) => colors[d.risk] + '33')
      .attr('stroke', (d) => colors[d.risk])
      .attr('stroke-width', 2)
      .style('filter', (d) => d.risk === 'HIGH' ? 'url(#lglow)' : 'none')

    sim.on('tick', () => {
      link.attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y)
      node.attr('cx', (d) => d.x).attr('cy', (d) => d.y)
    })

    return () => sim.stop()
  }, [])

  return <svg ref={svgRef} className="w-full" style={{ height: 300 }} />
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-[#F7F9FC]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0A0E1A]/90 backdrop-blur border-b border-[#2D3748]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-bold">GR<span className="text-[#00D4AA]">ACE</span></span>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm text-[#94A3B8] hover:text-[#F7F9FC] transition-colors">
              Login
            </button>
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm bg-[#00D4AA] text-[#0A0E1A] font-semibold rounded-md hover:bg-[#00D4AA]/90 transition-colors">
              Request Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00D4AA]/10 border border-[#00D4AA]/30 rounded-full text-xs text-[#00D4AA] font-mono mb-6">
              Squad Hackathon 3.0 2026 · RegTech Hackathon
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Detect the network,<br />
              <span className="text-gradient-accent">not just the node.</span>
            </h1>
            <p className="text-[#94A3B8] text-base leading-relaxed mb-8">
              TARA is an enterprise trust verification platform that maps financial relationships, detects laundering patterns, and auto-generates NFIU-compliant STRs — powered by graph intelligence and LLM.
            </p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/login')} className="px-6 py-3 bg-[#00D4AA] text-[#0A0E1A] font-semibold rounded-lg hover:bg-[#00D4AA]/90 transition-colors">
                Get Early Access
              </button>
              <button onClick={() => navigate('/login')} className="px-6 py-3 bg-[#1C2333] border border-[#2D3748] text-[#F7F9FC] font-medium rounded-lg hover:bg-[#2D3748] transition-colors">
                See Demo →
              </button>
            </div>
          </div>
          <div className="bg-[#111827] border border-[#2D3748] rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-[#2D3748] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="ml-2 text-xs text-[#4B5563] font-mono">graph-explorer · live</span>
            </div>
            <MiniGraph />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#2D3748] bg-[#111827]/50">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((s) => (
            <div key={s.value} className="text-center">
              <p className="text-4xl font-bold font-mono text-[#00D4AA] mb-2">{s.value}</p>
              <p className="text-sm text-[#94A3B8]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">How TARA Works</h2>
        <div className="flex flex-col md:flex-row gap-0">
          {steps.map((s, i) => (
            <div key={s.n} className="flex-1 relative">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-10 h-10 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/30 flex items-center justify-center mb-3">
                  <span className="text-xs font-mono text-[#00D4AA]">{s.n}</span>
                </div>
                <h3 className="text-sm font-semibold text-[#F7F9FC] mb-1">{s.title}</h3>
                <p className="text-xs text-[#94A3B8]">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-5 right-0 w-full h-px bg-[#2D3748] translate-x-1/2 -z-10" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#111827]/50 border-y border-[#2D3748]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">Platform Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-[#111827] border border-[#2D3748] rounded-lg p-5 hover:border-[#00D4AA]/30 transition-colors">
                <div className="w-2 h-2 rounded-full bg-[#00D4AA] mb-3" />
                <h3 className="text-sm font-semibold text-[#F7F9FC] mb-2">{f.title}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#1C2333] border border-[#2D3748] rounded-full mb-6">
          <span className="text-xs font-mono text-[#00D4AA]">Squad Hackathon 3.0 2026</span>
        </div>
        <blockquote className="text-lg text-[#94A3B8] max-w-2xl mx-auto italic">
          "TARA represents the next generation of RegTech — where graph intelligence meets compliance automation."
        </blockquote>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#00D4AA]/10 to-[#00A8FF]/10 border-y border-[#00D4AA]/20">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to detect the network?</h2>
          <p className="text-[#94A3B8] mb-8">Join Nigerian banks and fintechs using TARA for trust verification.</p>
          <button onClick={() => navigate('/login')} className="px-8 py-4 bg-[#00D4AA] text-[#0A0E1A] font-bold rounded-lg text-lg hover:bg-[#00D4AA]/90 transition-colors">
            Start Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2D3748] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold">GR<span className="text-[#00D4AA]">ACE</span></span>
          <p className="text-xs text-[#4B5563] font-mono">© 2026 TARA · NFIU-compliant · SOC2 Ready · Squad Hackathon 3.0</p>
        </div>
      </footer>
    </div>
  )
}
