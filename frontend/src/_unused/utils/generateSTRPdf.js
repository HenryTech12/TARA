import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const NAVY = [10, 22, 40]
const BLACK = [0, 0, 0]
const WHITE = [255, 255, 255]
const LIGHT_GRAY = [245, 245, 245]
const MARGIN = 20

function toDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatDateTime(value) {
  const d = toDate(value)
  if (!d) return 'Not available'
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function formatFileDate(value = new Date()) {
  const d = toDate(value) || new Date()
  return `${pad2(d.getDate())}${pad2(d.getMonth() + 1)}${d.getFullYear()}`
}

function toTitleCase(value) {
  if (!value) return 'Unknown'
  return String(value)
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
}

function formatPatternType(value) {
  const map = {
    pos_cash_out_ring: 'POS Cash-Out Ring',
    shell_director_web: 'Shell Director Web',
    layered_transfer_chain: 'Layered Transfer Chain',
  }
  if (!value) return 'Unknown'
  return map[value] || toTitleCase(String(value).replace(/_/g, ' '))
}

function formatRiskPercent(value) {
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) return '0.0%'
  return `${(n * 100).toFixed(1)}%`
}

function shortId(value, length = 8) {
  if (!value) return 'N/A'
  return String(value).slice(0, length)
}

function shortHash(value, length = 16) {
  if (!value) return 'Hash unavailable'
  return `${String(value).slice(0, length)}...`
}

function statusMeta(decision) {
  const normalized = String(decision || 'pending').toLowerCase()
  if (normalized === 'approved') return { label: 'APPROVED', color: [34, 197, 94] }
  if (normalized === 'rejected') return { label: 'REJECTED', color: [239, 68, 68] }
  return { label: 'PENDING REVIEW', color: [245, 158, 11] }
}

function maskIdentity(value) {
  if (!value) return 'Not on record'
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return 'Not on record'
  const suffix = digits.slice(-4)
  return `***${suffix}`
}

function pickEntityIdList({ str, alert }) {
  if (Array.isArray(alert?.entityIds) && alert.entityIds.length > 0) return alert.entityIds
  if (Array.isArray(alert?.entity_ids) && alert.entity_ids.length > 0) return alert.entity_ids
  if (Array.isArray(str?.entity_ids) && str.entity_ids.length > 0) return str.entity_ids
  return []
}

function addSectionHeader(doc, text, y, pageWidth) {
  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(String(text || '').toUpperCase(), MARGIN, y)

  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, y + 1.8, pageWidth - MARGIN, y + 1.8)

  doc.setTextColor(...BLACK)
  return y + 8
}

function ensureSpace(doc, y, requiredHeight) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const footerReserve = 16
  if (y + requiredHeight > pageHeight - MARGIN - footerReserve) {
    doc.addPage()
    return MARGIN
  }
  return y
}

function drawFooter(doc) {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i)
    const y = pageHeight - 8

    doc.setTextColor(80, 80, 80)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    doc.text('CONFIDENTIAL — For regulatory use only', MARGIN, y)
    doc.text('TARA Trust Verification Platform', pageWidth / 2, y, { align: 'center' })
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - MARGIN, y, { align: 'right' })
  }
}

function renderNarrative(doc, text, startY) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const maxWidth = pageWidth - MARGIN * 2
  const paragraphs = (text || 'Report content pending generation')
    .split(/\r?\n/)
    .map((line) => line.trim())

  let y = startY
  doc.setFontSize(10)

  for (const line of paragraphs) {
    if (!line) {
      y += 2.5
      continue
    }

    const isHeaderLike = /:$/.test(line) && line.length <= 60
    const wrapped = doc.splitTextToSize(line, maxWidth)
    y = ensureSpace(doc, y, wrapped.length * 5 + 2)

    doc.setFont('helvetica', isHeaderLike ? 'bold' : 'normal')
    doc.setTextColor(...BLACK)
    doc.text(wrapped, MARGIN, y)
    y += wrapped.length * 5 + 1.5
  }

  return y
}

function tableStyles() {
  return {
    theme: 'grid',
    margin: { left: MARGIN, right: MARGIN },
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
      valign: 'middle',
    },
    bodyStyles: {
      textColor: BLACK,
      fontSize: 9,
      halign: 'left',
      valign: 'middle',
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: LIGHT_GRAY,
    },
  }
}

export function generateSTRPdf({ str, alert, entities = [] }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  const strId = str?.id || 'unknown'
  const strShort = shortId(strId, 8)
  const createdAt = str?.createdAt || str?.created_at
  const decisionValue = str?.decision || 'pending'
  const status = statusMeta(decisionValue)
  const alertId = alert?.id || str?.alertId || str?.alert_id || 'N/A'
  const alertEntityIds = pickEntityIdList({ str, alert })

  let y = MARGIN

  // Top section — Header
  doc.setTextColor(...BLACK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('SUSPICIOUS TRANSACTION REPORT', pageWidth / 2, y, { align: 'center' })

  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`NFIU Filing Reference: STR-${strShort}`, MARGIN, y)
  doc.text(`Generated: ${formatDateTime(createdAt)}`, pageWidth - MARGIN, y, { align: 'right' })

  y += 3.5
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, pageWidth - MARGIN, y)
  y += 7

  // Section 1 — Reporting Institution
  y = addSectionHeader(doc, 'Reporting Institution', y, pageWidth)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('TARA — Verification Engine for Risk Analysis', MARGIN, y)
  y += 5
  doc.text('Filed via automated compliance platform', MARGIN, y)
  y += 7

  // Section 2 — Report Status
  y = addSectionHeader(doc, 'Report Status', y, pageWidth)
  autoTable(doc, {
    ...tableStyles(),
    startY: y,
    head: [['Status', 'Decision Date', 'Payload Hash']],
    body: [[
      status.label,
      formatDateTime(str?.updatedAt || str?.updated_at || createdAt),
      shortHash(str?.payloadHash || str?.payload_hash),
    ]],
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 0) {
        data.cell.styles.textColor = status.color
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })
  y = doc.lastAutoTable.finalY + 6

  // Section 3 — Detection Summary
  y = addSectionHeader(doc, 'Detection Summary', y, pageWidth)
  autoTable(doc, {
    ...tableStyles(),
    startY: y,
    head: [['Field', 'Value']],
    body: [
      ['Pattern Type', formatPatternType(alert?.patternType || alert?.pattern_type)],
      ['Risk Score', formatRiskPercent(alert?.riskScore || alert?.risk_score)],
      ['Detection Date', formatDateTime(alert?.detectedAt || alert?.created_at || createdAt)],
      ['Entities Involved', String(alertEntityIds.length)],
      ['Alert ID', shortId(alertId, 8)],
    ],
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
    },
  })
  y = doc.lastAutoTable.finalY + 6

  // Section 4 — Entities Involved
  y = ensureSpace(doc, y, 24)
  y = addSectionHeader(doc, 'Entities Involved', y, pageWidth)

  const entityById = new Map((entities || []).filter(Boolean).map((e) => [e.id, e]))
  const entityRows = alertEntityIds.length > 0
    ? alertEntityIds.map((entityId, index) => {
        const e = entityById.get(entityId)
        if (!e) {
          return [
            String(index + 1),
            String(entityId),
            'Details pending',
            'Details available in platform',
          ]
        }

        const identifier = e.bvn
          ? `BVN ${maskIdentity(e.bvn)}`
          : e.nin
          ? `NIN ${maskIdentity(e.nin)}`
          : 'Not on record'

        return [
          String(index + 1),
          e.full_name || e.canonicalName || String(entityId),
          toTitleCase(e.entity_type || e.entityType),
          identifier,
        ]
      })
    : [['-', 'No entities flagged', '—', '—']]

  autoTable(doc, {
    ...tableStyles(),
    startY: y,
    head: [['#', 'Entity Name', 'Entity Type', 'BVN/NIN']],
    body: entityRows,
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 34 },
      3: { cellWidth: 44 },
    },
  })
  y = doc.lastAutoTable.finalY + 6

  // Section 5 — Narrative
  y = ensureSpace(doc, y, 18)
  y = addSectionHeader(doc, 'Narrative (AI-Generated)', y, pageWidth)
  y = renderNarrative(doc, str?.draftContent || str?.content_text || str?.contentText, y)
  y += 4

  // Section 6 — Audit Trail
  y = ensureSpace(doc, y, 30)
  y = addSectionHeader(doc, 'Audit Trail', y, pageWidth)
  autoTable(doc, {
    ...tableStyles(),
    startY: y,
    head: [['Action', 'Timestamp', 'Hash']],
    body: [
      [
        'STR Generated',
        formatDateTime(createdAt),
        shortHash(str?.payloadHash || str?.payload_hash),
      ],
      [
        `Decision: ${status.label}`,
        formatDateTime(str?.updatedAt || str?.updated_at || createdAt),
        '—',
      ],
    ],
  })

  drawFooter(doc)

  const filename = `STR_${strShort}_${formatFileDate()}.pdf`
  doc.save(filename)
  return filename
}
