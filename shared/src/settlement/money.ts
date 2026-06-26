export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error('Money amount must be a finite number');
  }

  return Math.round((amount + Number.EPSILON) * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
