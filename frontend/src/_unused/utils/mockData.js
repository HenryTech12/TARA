export const mockAlerts = [
  { id: 'ALT-001', patternType: 'POS_RING', riskLevel: 'HIGH', riskScore: 0.94, entityCount: 7, entityIds: ['ENT-001','ENT-002','ENT-003','ENT-004','ENT-005','ENT-006','ENT-007'], totalVolume: 210000000, detectedAt: '2026-04-14T09:41:00Z', status: 'OPEN', evidenceHash: 'a3f9c2d1e8b74f6a9c0d2e5f8a1b3c7d' },
  { id: 'ALT-002', patternType: 'SHELL_WEB', riskLevel: 'HIGH', riskScore: 0.88, entityCount: 4, entityIds: ['ENT-008','ENT-009','ENT-010','ENT-011'], totalVolume: 450000000, detectedAt: '2026-04-14T08:15:00Z', status: 'IN_REVIEW', evidenceHash: 'b4e0d3c2f9a85g7b0d1e4g7a2c5d8e' },
  { id: 'ALT-003', patternType: 'LAYERED_CHAIN', riskLevel: 'MEDIUM', riskScore: 0.67, entityCount: 5, entityIds: ['ENT-012','ENT-013','ENT-014','ENT-015','ENT-016'], totalVolume: 89000000, detectedAt: '2026-04-13T22:30:00Z', status: 'OPEN', evidenceHash: 'c5f1e4d3g0b96h8c1e2f5h8b3d6e9f' },
  { id: 'ALT-004', patternType: 'POS_RING', riskLevel: 'MEDIUM', riskScore: 0.71, entityCount: 3, entityIds: ['ENT-017','ENT-018','ENT-019'], totalVolume: 38000000, detectedAt: '2026-04-13T18:00:00Z', status: 'STR_FILED', evidenceHash: 'd6g2f5e4h1c07i9d2f3g6i9c4e7f0g' },
  { id: 'ALT-005', patternType: 'SHELL_WEB', riskLevel: 'LOW', riskScore: 0.32, entityCount: 2, entityIds: ['ENT-020','ENT-021'], totalVolume: 12000000, detectedAt: '2026-04-12T14:20:00Z', status: 'DISMISSED', evidenceHash: 'e7h3g6f5i2d18j0e3g4h7j0d5f8g1h' },
  { id: 'ALT-006', patternType: 'LAYERED_CHAIN', riskLevel: 'HIGH', riskScore: 0.91, entityCount: 9, entityIds: ['ENT-022','ENT-023','ENT-024','ENT-025','ENT-026','ENT-027','ENT-028','ENT-029','ENT-030'], totalVolume: 780000000, detectedAt: '2026-04-12T10:05:00Z', status: 'IN_REVIEW', evidenceHash: 'f8i4h7g6j3e29k1f4h5i8k1e6g9h2i' },
]

export const mockEntities = [
  { id: 'ENT-001', canonicalName: 'Adewale Okonkwo', entityType: 'PERSON', bvn: '22198765432', nin: '98765432101', riskScore: 0.94, riskLevel: 'HIGH', linkedAlerts: ['ALT-001'], createdAt: '2026-01-15T00:00:00Z' },
  { id: 'ENT-002', canonicalName: 'Sunrise Ventures Ltd', entityType: 'BUSINESS', bvn: null, nin: null, riskScore: 0.88, riskLevel: 'HIGH', linkedAlerts: ['ALT-001','ALT-002'], createdAt: '2026-02-01T00:00:00Z' },
  { id: 'ENT-003', canonicalName: 'Fatima Bello', entityType: 'PERSON', bvn: '22187654321', nin: '87654321012', riskScore: 0.67, riskLevel: 'MEDIUM', linkedAlerts: ['ALT-001'], createdAt: '2026-01-20T00:00:00Z' },
  { id: 'ENT-004', canonicalName: 'Nexus Capital MFB', entityType: 'BUSINESS', bvn: null, nin: null, riskScore: 0.45, riskLevel: 'MEDIUM', linkedAlerts: ['ALT-001'], createdAt: '2025-11-10T00:00:00Z' },
  { id: 'ENT-005', canonicalName: 'Chukwuemeka Eze', entityType: 'PERSON', bvn: '22176543210', nin: '76543210123', riskScore: 0.22, riskLevel: 'LOW', linkedAlerts: [], createdAt: '2026-03-05T00:00:00Z' },
  { id: 'ENT-006', canonicalName: 'Pinnacle Logistics', entityType: 'BUSINESS', bvn: null, nin: null, riskScore: 0.78, riskLevel: 'HIGH', linkedAlerts: ['ALT-002'], createdAt: '2025-12-01T00:00:00Z' },
  { id: 'ENT-007', canonicalName: 'Amina Yusuf', entityType: 'PERSON', bvn: '22165432109', nin: '65432109234', riskScore: 0.55, riskLevel: 'MEDIUM', linkedAlerts: ['ALT-003'], createdAt: '2026-02-14T00:00:00Z' },
  { id: 'ENT-008', canonicalName: 'Goldfield Holdings', entityType: 'BUSINESS', bvn: null, nin: null, riskScore: 0.91, riskLevel: 'HIGH', linkedAlerts: ['ALT-002','ALT-006'], createdAt: '2025-10-20T00:00:00Z' },
]

export const mockSTRs = [
  { id: 'STR-001', alertId: 'ALT-001', draftContent: `SUSPICIOUS TRANSACTION REPORT\n\nSection 1: Parties Involved\nPrimary Subject: Adewale Okonkwo (BVN: 22198765432)\nAssociated Entities: Sunrise Ventures Ltd, Fatima Bello, Nexus Capital MFB\n\nSection 2: Nature of Suspicious Conduct\nA coordinated POS cash-out ring was detected involving 7 entities over a 72-hour window. Transactions totalling ₦2,100,000 were routed through multiple POS terminals in Lagos Island, Ikeja, and Surulere LGAs.\n\nSection 3: Grounds for Suspicion\nThe pattern exhibits classic structuring behaviour: individual transactions kept below ₦500,000 threshold, rapid cycling through intermediary accounts, and same-day withdrawal at POS terminals. Risk score: 0.94/1.0.\n\nSection 4: Actions Taken\nAll flagged accounts have been placed under enhanced monitoring. Transaction freeze request submitted to compliance team. This report is being filed in accordance with NFIU Circular 2023/001.`, status: 'PENDING', reviewerNotes: '', modelVersion: 'llama-3.3-70b', payloadHash: 'a3f9c2d1e8b74f6a9c0d2e5f8a1b3c7d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4', createdAt: '2026-04-14T10:00:00Z', updatedAt: '2026-04-14T10:00:00Z' },
  { id: 'STR-002', alertId: 'ALT-004', draftContent: `SUSPICIOUS TRANSACTION REPORT\n\nSection 1: Parties Involved\nPrimary Subject: Nexus Capital MFB\nAssociated Entities: 3 linked accounts\n\nSection 2: Nature of Suspicious Conduct\nPOS cash-out ring detected with ₦380,000 total volume across 3 entities.\n\nSection 3: Grounds for Suspicion\nStructured transactions below reporting threshold. Risk score: 0.71/1.0.\n\nSection 4: Actions Taken\nSTR filed with NFIU. Accounts under monitoring.`, status: 'FILED', reviewerNotes: 'Reviewed and approved by CCO', modelVersion: 'llama-3.3-70b', payloadHash: 'd6g2f5e4h1c07i9d2f3g6i9c4e7f0g1h3j5l7n9p1r3t5v7x9z1b3d5f7h9j1l3', createdAt: '2026-04-13T20:00:00Z', updatedAt: '2026-04-14T08:30:00Z' },
  { id: 'STR-003', alertId: 'ALT-006', draftContent: `SUSPICIOUS TRANSACTION REPORT\n\nSection 1: Parties Involved\nPrimary Subject: Goldfield Holdings\nAssociated Entities: 9 linked entities\n\nSection 2: Nature of Suspicious Conduct\nLayered transfer chain detected with ₦7,800,000 total volume.\n\nSection 3: Grounds for Suspicion\nMulti-layer fund movement through shell entities. Risk score: 0.91/1.0.\n\nSection 4: Actions Taken\nUnder review by compliance team.`, status: 'PENDING', reviewerNotes: '', modelVersion: 'llama-3.3-70b', payloadHash: 'f8i4h7g6j3e29k1f4h5i8k1e6g9h2i3j5l7n9p1r3t5v7x9z1b3d5f7h9j1l3n5', createdAt: '2026-04-12T11:00:00Z', updatedAt: '2026-04-12T11:00:00Z' },
]

export const mockAuditLog = [
  { id: 'AUD-001', timestamp: '2026-04-14T10:05:00Z', action: 'STR_GENERATED', target: 'STR-001', targetType: 'STR', user: 'TARA AI', hash: 'a3f9c2d1e8b7...', verified: true },
  { id: 'AUD-002', timestamp: '2026-04-14T09:41:00Z', action: 'ALERT_CREATED', target: 'ALT-001', targetType: 'ALERT', user: 'TARA Engine', hash: 'b4e0d3c2f9a8...', verified: true },
  { id: 'AUD-003', timestamp: '2026-04-14T09:00:00Z', action: 'ENTITY_VIEWED', target: 'ENT-001', targetType: 'ENTITY', user: 'Akeem Jr.', hash: 'c5f1e4d3g0b9...', verified: true },
  { id: 'AUD-004', timestamp: '2026-04-13T20:30:00Z', action: 'STR_FILED', target: 'STR-002', targetType: 'STR', user: 'Akeem Jr.', hash: 'd6g2f5e4h1c0...', verified: true },
  { id: 'AUD-005', timestamp: '2026-04-13T18:05:00Z', action: 'ALERT_STATUS_CHANGED', target: 'ALT-004', targetType: 'ALERT', user: 'Akeem Jr.', hash: 'e7h3g6f5i2d1...', verified: true },
  { id: 'AUD-006', timestamp: '2026-04-13T14:20:00Z', action: 'ALERT_DISMISSED', target: 'ALT-005', targetType: 'ALERT', user: 'Akeem Jr.', hash: 'f8i4h7g6j3e2...', verified: true },
  { id: 'AUD-007', timestamp: '2026-04-12T10:10:00Z', action: 'ALERT_CREATED', target: 'ALT-006', targetType: 'ALERT', user: 'TARA Engine', hash: 'g9j5i8h7k4f3...', verified: true },
  { id: 'AUD-008', timestamp: '2026-04-12T08:00:00Z', action: 'USER_LOGIN', target: 'Akeem Jr.', targetType: 'USER', user: 'Akeem Jr.', hash: 'h0k6j9i8l5g4...', verified: true },
]

export const mockTransactions = [
  { id: 'TXN-001', fromEntity: 'ENT-001', toEntity: 'ENT-002', amount: 49500000, type: 'POS_WITHDRAWAL', flag: 'STRUCTURING', date: '2026-04-14T08:30:00Z' },
  { id: 'TXN-002', fromEntity: 'ENT-002', toEntity: 'ENT-003', amount: 48000000, type: 'TRANSFER', flag: 'RAPID_MOVEMENT', date: '2026-04-14T08:45:00Z' },
  { id: 'TXN-003', fromEntity: 'ENT-003', toEntity: 'ENT-004', amount: 47500000, type: 'POS_WITHDRAWAL', flag: 'STRUCTURING', date: '2026-04-14T09:00:00Z' },
  { id: 'TXN-004', fromEntity: 'ENT-004', toEntity: 'ENT-001', amount: 46000000, type: 'TRANSFER', flag: 'CIRCULAR', date: '2026-04-14T09:15:00Z' },
  { id: 'TXN-005', fromEntity: 'ENT-001', toEntity: 'ENT-005', amount: 19000000, type: 'POS_WITHDRAWAL', flag: 'STRUCTURING', date: '2026-04-14T09:30:00Z' },
]

export const mockRiskTrend = [
  { date: '04/08', high: 3, medium: 5, low: 8 },
  { date: '04/09', high: 4, medium: 6, low: 7 },
  { date: '04/10', high: 2, medium: 8, low: 9 },
  { date: '04/11', high: 6, medium: 4, low: 6 },
  { date: '04/12', high: 5, medium: 7, low: 8 },
  { date: '04/13', high: 8, medium: 5, low: 5 },
  { date: '04/14', high: 12, medium: 6, low: 4 },
]

export const mockVolumeData = [
  { date: '04/08', volume: 120 },
  { date: '04/09', volume: 180 },
  { date: '04/10', volume: 95 },
  { date: '04/11', volume: 210 },
  { date: '04/12', volume: 165 },
  { date: '04/13', volume: 290 },
  { date: '04/14', volume: 340 },
]

export const mockGraphData = {
  nodes: [
    { id: 'ENT-001', label: 'Adewale O.', type: 'PERSON', risk: 'HIGH' },
    { id: 'ENT-002', label: 'Sunrise Ventures', type: 'BUSINESS', risk: 'HIGH' },
    { id: 'ENT-003', label: 'Fatima B.', type: 'PERSON', risk: 'MEDIUM' },
    { id: 'ENT-004', label: 'Nexus Capital', type: 'BUSINESS', risk: 'MEDIUM' },
    { id: 'ENT-005', label: 'Chukwuemeka E.', type: 'PERSON', risk: 'LOW' },
    { id: 'ENT-006', label: 'Pinnacle Logistics', type: 'BUSINESS', risk: 'HIGH' },
    { id: 'ENT-007', label: 'Amina Y.', type: 'PERSON', risk: 'MEDIUM' },
    { id: 'ENT-008', label: 'Goldfield Holdings', type: 'BUSINESS', risk: 'HIGH' },
    { id: 'ENT-009', label: 'Bright Future MFB', type: 'BUSINESS', risk: 'LOW' },
    { id: 'ENT-010', label: 'Emeka Obi', type: 'PERSON', risk: 'MEDIUM' },
    { id: 'ENT-011', label: 'Lagos Traders', type: 'BUSINESS', risk: 'HIGH' },
    { id: 'ENT-012', label: 'Ngozi Adeyemi', type: 'PERSON', risk: 'LOW' },
  ],
  links: [
    { source: 'ENT-001', target: 'ENT-002', value: 210 },
    { source: 'ENT-002', target: 'ENT-003', value: 180 },
    { source: 'ENT-003', target: 'ENT-004', value: 150 },
    { source: 'ENT-004', target: 'ENT-001', value: 200 },
    { source: 'ENT-001', target: 'ENT-005', value: 90 },
    { source: 'ENT-002', target: 'ENT-006', value: 320 },
    { source: 'ENT-006', target: 'ENT-007', value: 110 },
    { source: 'ENT-007', target: 'ENT-008', value: 450 },
    { source: 'ENT-008', target: 'ENT-009', value: 80 },
    { source: 'ENT-009', target: 'ENT-010', value: 60 },
    { source: 'ENT-010', target: 'ENT-011', value: 270 },
    { source: 'ENT-011', target: 'ENT-008', value: 380 },
    { source: 'ENT-005', target: 'ENT-012', value: 40 },
  ],
}
