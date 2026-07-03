/** Pro-rated target incentive per rep = annual TI x (months / 12). */
export function proratedTargetIncentive(
  annualTargetIncentive: number,
  durationMonths: number,
): number {
  return annualTargetIncentive * (durationMonths / 12)
}
