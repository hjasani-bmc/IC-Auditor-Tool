/**
 * High-level upload pipeline: parse a file then validate it against a dataset
 * descriptor. Returns the validation result; the caller commits valid rows to
 * the store.
 */
import { findDescriptor, type DatasetKind } from './datasets'
import { parseFile } from './parse'
import { validateDataset, type ValidationResult } from './validate'
import type { MetricDataType } from '../domain/types'

export async function processUpload(
  file: File,
  kind: DatasetKind,
  dataType: MetricDataType,
): Promise<ValidationResult> {
  const descriptor = findDescriptor(kind, dataType)
  if (!descriptor) {
    throw new Error(`No dataset descriptor for ${kind}/${dataType}.`)
  }
  const parsed = await parseFile(file)
  return validateDataset(parsed, descriptor)
}
