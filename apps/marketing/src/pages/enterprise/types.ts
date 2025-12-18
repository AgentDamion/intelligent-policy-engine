// Enterprise Dashboard TypeScript Types (ported)

export type Overview = {
  compliancePct: number
  partners: number
  tools: number
  openRisks: number
  timeWindow: '7d' | '30d' | '90d'
}

export type HeatCell = {
  partner: string
  category: string
  risk: 'low' | 'medium' | 'high'
  score: number
}

export type HeatMap = {
  matrix: HeatCell[]
  categories: string[]
  partners: string[]
}

export type MetaLoopRec = {
  id: string
  title: string
  confidence: number
  rationale?: string
}

export type MetaLoopLatest = {
  phase: 'observe' | 'document' | 'analyze' | 'recommend'
  recommendation?: MetaLoopRec
}

export type Approval = {
  id: string
  item: string
  source: string
  risk: 'low' | 'medium' | 'high'
  status: 'needs_human' | 'approved' | 'rejected' | 'pending'
  age: string
}

export type TimelineItem = {
  id: string
  actor: string
  label: string
  ts: string
  tags?: string[]
  icon?: string
}

export type PartnerHealth = {
  partner: string
  compliancePct: number
  openItems: number
  series: number[]
}


