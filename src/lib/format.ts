export function money(n: number, currency = 'KES') {
  return `${currency === 'KES' ? 'KSh' : currency} ${num(n)}`;
}

export function num(n: number) {
  return Math.round(n).toLocaleString('en-US');
}

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
