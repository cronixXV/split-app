const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
});

export function formatMoney(amount: number): string {
  return currencyFormatter.format(amount);
}
