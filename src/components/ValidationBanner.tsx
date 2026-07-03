import { Link } from 'react-router-dom'
import type { PlanValidation } from '../engine'

/** Shows blocking validation errors with a link back to Plan Setup. */
export function ValidationBanner({
  validation,
  showLink = true,
}: {
  validation: PlanValidation
  showLink?: boolean
}) {
  if (validation.canCalculate) return null
  return (
    <div className="card border-amber-200 bg-amber-50 p-4">
      <p className="font-medium text-amber-800">
        Calculation is blocked until the plan is valid
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
        {validation.errors.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
      {showLink && (
        <Link to="/setup" className="btn-primary mt-3">
          Go to Plan Setup
        </Link>
      )}
    </div>
  )
}
