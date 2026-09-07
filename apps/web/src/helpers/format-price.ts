export function formatPrice(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000)
      .toFixed(2)
      .replace(/\.?0+$/, '')
      .replace('.', ',')} tỷ`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000)
      .toFixed(2)
      .replace(/\.?0+$/, '')
      .replace('.', ',')} triệu`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000)
      .toFixed(2)
      .replace(/\.?0+$/, '')
      .replace('.', ',')} nghìn`;
  }

  return value.toString();
}
