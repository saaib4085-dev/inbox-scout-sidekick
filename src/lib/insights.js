export function formatEuro(cents) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format((cents ?? 0) / 100);
}

export function share(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}