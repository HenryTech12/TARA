import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { riskNodeColor } from '@/utils/riskColors'
import { NodeTooltip } from './NodeTooltip'

// height prop is optional — if provided the container uses that fixed px height,
// otherwise it stretches to fill its flex parent (use inside a flex-1 container).
export function GraphCanvas({ nodes, links, onNodeClick, height }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const simRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  const render = useCallback(() => {
    const container = containerRef.current
    const el = svgRef.current
    if (!nodes?.length || !el || !container) return

    const width = container.clientWidth || 900
    const height = container.clientHeight || 600

    d3.select(el).selectAll('*').remove()

    const nodeData = nodes.map((n) => ({ ...n }))
    const linkData = links.map((l) => ({
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target,
      value: l.value,
    }))

    const svg = d3.select(el).attr('width', width).attr('height', height)
    const g = svg.append('g')

    // Zoom behaviour — keep reference for auto-fit
    const zoom = d3.zoom()
      .scaleExtent([0.05, 4])
      .on('zoom', (e) => g.attr('transform', e.transform))
    svg.call(zoom)

    // Glow filter
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Scale force params with node count so large graphs spread out
    const n = nodeData.length
    const linkDist  = Math.max(60,  Math.min(160, 800  / Math.sqrt(n)))
    const charge    = Math.max(-800, -180 * Math.sqrt(n))
    const collide   = Math.max(18,   Math.min(32, 300 / Math.sqrt(n)))

    if (simRef.current) simRef.current.stop()

    const sim = d3.forceSimulation(nodeData)
      .force('link',      d3.forceLink(linkData).id((d) => d.id).distance(linkDist).strength(0.7))
      .force('charge',    d3.forceManyBody().strength(charge))
      .force('center',    d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(collide))
      .force('x',         d3.forceX(width  / 2).strength(0.04))
      .force('y',         d3.forceY(height / 2).strength(0.04))
      .alphaDecay(0.015) // slower cooling → better spread

    simRef.current = sim

    const link = g.append('g')
      .selectAll('line')
      .data(linkData)
      .join('line')
      .attr('stroke', '#2D3748')
      .attr('stroke-width', (d) => Math.max(0.8, Math.sqrt((d.value ?? 50) / 50)))
      .attr('stroke-opacity', 0.55)

    const node = g.append('g')
      .selectAll('g')
      .data(nodeData)
      .join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y })
          .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
      )

    node.append('circle')
      .attr('r', 10)
      .attr('fill', (d) => riskNodeColor[d.risk] ?? '#3B82F6')
      .attr('fill-opacity', 0.2)
      .attr('stroke', (d) => riskNodeColor[d.risk] ?? '#3B82F6')
      .attr('stroke-width', 2)
      .style('filter', (d) => d.risk === 'HIGH' ? 'url(#glow)' : 'none')

    node.append('text')
      .text((d) => (d.label ?? d.id ?? '').slice(0, 20))
      .attr('x', 14)
      .attr('y', 4)
      .attr('fill', '#94A3B8')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .style('pointer-events', 'none')

    node
      .on('mouseover', (e, d) => {
        setTooltip({ x: e.offsetX, y: e.offsetY, node: d })
        d3.select(e.currentTarget).select('circle').attr('fill-opacity', 0.5)
      })
      .on('mousemove', (e) => setTooltip((p) => p ? { ...p, x: e.offsetX, y: e.offsetY } : p))
      .on('mouseout', (e) => {
        setTooltip(null)
        d3.select(e.currentTarget).select('circle').attr('fill-opacity', 0.2)
      })
      .on('click', (e, d) => { e.stopPropagation(); onNodeClick?.(d) })

    sim.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)
      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    // Auto-fit all nodes into view once simulation settles
    sim.on('end', () => {
      if (!nodeData.length) return
      const pad = 48
      const xs  = nodeData.map((d) => d.x).filter(Number.isFinite)
      const ys  = nodeData.map((d) => d.y).filter(Number.isFinite)
      if (!xs.length) return
      const minX = Math.min(...xs) - pad
      const maxX = Math.max(...xs) + pad
      const minY = Math.min(...ys) - pad
      const maxY = Math.max(...ys) + pad
      const gw   = maxX - minX
      const gh   = maxY - minY
      const scale = Math.min(0.92 * width / gw, 0.92 * height / gh, 2)
      const tx    = width  / 2 - scale * ((minX + maxX) / 2)
      const ty    = height / 2 - scale * ((minY + maxY) / 2)
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      )
    })

    return () => sim.stop()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links])

  // Re-render whenever node/link data changes
  useEffect(() => {
    const cleanup = render()
    return () => { cleanup?.(); simRef.current?.stop() }
  }, [render])

  // Re-render on container resize (handles sidebar open/close, window resize)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => render())
    ro.observe(container)
    return () => ro.disconnect()
  }, [render])

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={height ? { height } : { height: '100%' }}
    >
      <svg ref={svgRef} className="w-full h-full" />
      <NodeTooltip node={tooltip?.node} x={tooltip?.x} y={tooltip?.y} />
    </div>
  )
}
