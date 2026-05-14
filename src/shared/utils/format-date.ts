type FormatDateOptions = Intl.DateTimeFormatOptions

export function formatDate(
  value: Date | string | number,
  locale = 'es-PE',
  options: FormatDateOptions = { year: 'numeric', month: 'short', day: '2-digit' }
) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale, options).format(date)
}
