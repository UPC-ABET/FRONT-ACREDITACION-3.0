export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait = 300
) {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Args) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), wait)
  }
}
