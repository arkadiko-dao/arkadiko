export function classNames(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).sort().join(' ')
}
