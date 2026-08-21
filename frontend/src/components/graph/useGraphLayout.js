import { useMemo } from 'react'

export function useGraphLayout(filterRisk = 'ALL', graphData = null) {
  // Node risk resolves progressively (e.g. TARA's per-node verdict fetches
  // stream in after the initial graph load) without the node/link count
  // changing, so memoizing on count alone would freeze on the first
  // (unresolved) snapshot — key on each node's risk value too.
  const riskSignature = (graphData?.nodes ?? []).map((n) => `${n.id}:${n.risk}`).join('|')

  return useMemo(() => {
    let nodes = graphData?.nodes ?? []
    let links = graphData?.links ?? []

    if (filterRisk !== 'ALL') {
      nodes = nodes.filter((n) => n.risk === filterRisk)
    }

    const nodeIds = new Set(nodes.map((n) => n.id))
    links = links.filter((l) => {
      const src = typeof l.source === 'object' ? l.source.id : l.source
      const tgt = typeof l.target === 'object' ? l.target.id : l.target
      return nodeIds.has(src) && nodeIds.has(tgt)
    })

    return {
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
        value: l.value,
      })),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRisk, riskSignature, graphData?.links?.length])
}
