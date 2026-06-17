export function hasAtMostTwoDecimalPlaces(amount: number): boolean {
  const rounded = Math.round(amount * 100) / 100;

  return Math.abs(amount - rounded) < 1e-9;
}
