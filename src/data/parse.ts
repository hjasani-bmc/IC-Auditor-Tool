/**
 * File parsing: read .xlsx or .csv into a normalized array of raw record rows
 * (header -> cell), using SheetJS for both formats. SheetJS is imported
 * dynamically so it stays out of the initial bundle.
 */
export type RawRecord = Record<string, string | number | boolean | null>

export interface ParsedFile {
  headers: string[]
  rows: RawRecord[]
}

const ACCEPTED = /\.(xlsx|xls|csv)$/i

export function isAcceptedFile(name: string): boolean {
  return ACCEPTED.test(name)
}

export async function parseFile(file: File): Promise<ParsedFile> {
  if (!isAcceptedFile(file.name)) {
    throw new Error(
      `Unsupported file type: ${file.name}. Please upload an .xlsx or .csv file.`,
    )
  }
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const firstSheet = wb.SheetNames[0]
  if (!firstSheet) throw new Error('The file contains no worksheets.')
  const ws = wb.Sheets[firstSheet]

  // header:1 gives an array-of-arrays so we can capture the real header row.
  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, {
    header: 1,
    blankrows: false,
    defval: null,
  })
  if (matrix.length === 0) return { headers: [], rows: [] }

  const headers = (matrix[0] ?? []).map((h) => String(h ?? '').trim())
  const rows: RawRecord[] = []
  for (let i = 1; i < matrix.length; i++) {
    const cells = matrix[i] ?? []
    // Skip fully-empty rows.
    if (cells.every((c) => c === null || String(c).trim() === '')) continue
    const rec: RawRecord = {}
    headers.forEach((h, c) => {
      if (h) rec[h] = (cells[c] ?? null) as string | number | null
    })
    rows.push(rec)
  }
  return { headers, rows }
}
