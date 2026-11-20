const numberFormat = new Intl.NumberFormat("en-US")

export function formatNumber(value) {
  return numberFormat.format(value)
}

export function formatPercent(value, digits = 1) {
  return `${Number(value).toFixed(digits)}%`
}

export function formatRating(value) {
  return Number(value).toFixed(1)
}
