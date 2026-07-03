/**
 * planParser.ts
 * Extracts IC plan data from uploaded documents using the Gemini API.
 * Supports PDF, DOCX, PPTX, and JSON files.
 * Pure service — no React imports.
 */

import type { MechanismType, MetricDataType, MeasurementLevel } from '../domain/types'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ParsedMetric {
  name: string
  definition?: string
  dataType?: MetricDataType
  level?: MeasurementLevel
  weight?: number
  mechanism?: MechanismType
  /** Whether this field needs user review (missing / ambiguous). */
  needsReview?: boolean
}

export interface ParsedPlan {
  name?: string
  quarter?: string
  year?: string
  startDate?: string
  endDate?: string
  annualTargetIncentive?: number
  eligibilityCriteria?: string
  territoryInfo?: string
  payoutRules?: string
  metrics: ParsedMetric[]
  /** Fields that could not be confidently parsed. */
  ambiguousFields: string[]
  /** Raw text extracted from the document (used for debugging / review). */
  rawSummary?: string
}

export type ParseStatus =
  | { stage: 'reading'; progress: number }
  | { stage: 'parsing' }
  | { stage: 'done'; plan: ParsedPlan }
  | { stage: 'error'; message: string }

// ---------------------------------------------------------------------------
// File → text extraction (client-side, no backend)
// ---------------------------------------------------------------------------

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase()

  if (name.endsWith('.json')) {
    return file.text()
  }

  if (name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.pptx')) {
    // For binary formats we send the file as base64 directly to Gemini,
    // which supports multimodal inputs (PDF natively; DOCX/PPTX as raw bytes).
    return '__binary__'
  }

  // Fallback: treat as plain text
  return file.text()
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // strip the data URL prefix "data:...;base64,"
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// ---------------------------------------------------------------------------
// Gemini API call
// ---------------------------------------------------------------------------

const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const SYSTEM_PROMPT = `You are an expert at extracting Incentive Compensation (IC) plan information from business documents.

Extract the following fields from the document and return ONLY a valid JSON object — no markdown fences, no preamble:

{
  "name": "Plan name (string or null)",
  "quarter": "Quarter e.g. Q1, Q2, H1 (string or null)",
  "year": "Year e.g. 2026 (string or null)",
  "startDate": "ISO date yyyy-mm-dd or null",
  "endDate": "ISO date yyyy-mm-dd or null",
  "annualTargetIncentive": "Annual TI in USD as number or null",
  "eligibilityCriteria": "Eligibility rules as plain text or null",
  "territoryInfo": "Territory/region info as plain text or null",
  "payoutRules": "General payout rules as plain text or null",
  "metrics": [
    {
      "name": "Metric name",
      "definition": "What this metric measures",
      "dataType": "One of: SalesUnits | HCPReach | MBORating | Other",
      "level": "One of: Territory | Area | Nation",
      "weight": "Integer 0-100 or null",
      "mechanism": "One of: Curve | Grid | RatingMap | Commission | Rank or null"
    }
  ],
  "ambiguousFields": ["list of field names that were unclear or missing"]
}

Rules:
- Extract up to 5 metrics maximum.
- dataType must be one of: SalesUnits, HCPReach, MBORating, Other
- level must be one of: Territory, Area, Nation
- mechanism must be one of: Curve, Grid, RatingMap, Commission, Rank
- If a field is absent or unclear, use null and add it to ambiguousFields.
- Do not invent values — only extract what is explicitly stated or clearly implied.
- Weights should be whole integers that sum to 100 when all are present.`

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
  error?: { message: string }
}

async function callGemini(apiKey: string, file: File, textContent: string): Promise<string> {
  const isBinary = textContent === '__binary__'
  const name = file.name.toLowerCase()

  // Determine MIME type for binary uploads
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  }
  const ext = Object.keys(mimeMap).find((e) => name.endsWith(e))
  const mimeType = ext ? mimeMap[ext] : 'text/plain'

  // Build the content parts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parts: any[]

  if (isBinary) {
    const base64 = await fileToBase64(file)
    parts = [
      { text: SYSTEM_PROMPT + '\n\nDocument to analyse:' },
      { inline_data: { mime_type: mimeType, data: base64 } },
    ]
  } else {
    parts = [
      {
        text: `${SYSTEM_PROMPT}\n\nDocument content:\n\`\`\`\n${textContent.slice(0, 40000)}\n\`\`\``,
      },
    ]
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data: GeminiResponse = await res.json()

  if (!res.ok || data.error) {
    const msg = data.error?.message ?? `Gemini API error ${res.status}`
    throw new Error(msg)
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ---------------------------------------------------------------------------
// Response → ParsedPlan
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeParsed(raw: any, file: File): ParsedPlan {
  const VALID_DATA_TYPES: MetricDataType[] = ['SalesUnits', 'HCPReach', 'MBORating', 'Other']
  const VALID_LEVELS: MeasurementLevel[] = ['Territory', 'Area', 'Nation']
  const VALID_MECHANISMS: MechanismType[] = ['Curve', 'Grid', 'RatingMap', 'Commission', 'Rank']

  const ambiguous: string[] = Array.isArray(raw.ambiguousFields) ? raw.ambiguousFields : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metrics: ParsedMetric[] = (Array.isArray(raw.metrics) ? raw.metrics : []).slice(0, 5).map((m: any) => {
    const metric: ParsedMetric = {
      name: typeof m.name === 'string' && m.name ? m.name : 'Unnamed Metric',
      definition: m.definition ?? undefined,
      dataType: VALID_DATA_TYPES.includes(m.dataType) ? m.dataType : undefined,
      level: VALID_LEVELS.includes(m.level) ? m.level : undefined,
      weight: typeof m.weight === 'number' && m.weight >= 0 && m.weight <= 100 ? Math.round(m.weight) : undefined,
      mechanism: VALID_MECHANISMS.includes(m.mechanism) ? m.mechanism : undefined,
    }
    // Flag metrics that are missing critical fields
    metric.needsReview =
      !metric.dataType || !metric.level || metric.weight == null || !metric.mechanism
    return metric
  })

  return {
    name: typeof raw.name === 'string' ? raw.name : undefined,
    quarter: typeof raw.quarter === 'string' ? raw.quarter : undefined,
    year: typeof raw.year === 'string' ? raw.year : undefined,
    startDate: typeof raw.startDate === 'string' ? raw.startDate : undefined,
    endDate: typeof raw.endDate === 'string' ? raw.endDate : undefined,
    annualTargetIncentive:
      typeof raw.annualTargetIncentive === 'number' ? raw.annualTargetIncentive : undefined,
    eligibilityCriteria:
      typeof raw.eligibilityCriteria === 'string' ? raw.eligibilityCriteria : undefined,
    territoryInfo: typeof raw.territoryInfo === 'string' ? raw.territoryInfo : undefined,
    payoutRules: typeof raw.payoutRules === 'string' ? raw.payoutRules : undefined,
    metrics,
    ambiguousFields: ambiguous,
    rawSummary: `Parsed from: ${file.name}`,
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function parsePlanDocument(
  file: File,
  apiKey: string,
  onStatus: (s: ParseStatus) => void,
): Promise<ParsedPlan> {
  try {
    onStatus({ stage: 'reading', progress: 0.3 })
    const textContent = await extractText(file)

    onStatus({ stage: 'reading', progress: 0.7 })

    onStatus({ stage: 'parsing' })
    const rawText = await callGemini(apiKey, file, textContent)

    // Strip optional markdown fences
    const cleaned = rawText.replace(/```(?:json)?/g, '').trim()
    const parsed = normalizeParsed(JSON.parse(cleaned), file)

    onStatus({ stage: 'done', plan: parsed })
    return parsed
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during parsing'
    onStatus({ stage: 'error', message })
    throw err
  }
}
