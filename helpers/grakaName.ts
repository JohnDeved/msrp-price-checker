export function formatGrakaName(name: string) {
  return name
    .match(/(GTX|RTX|RX) *?(\d{2,8}) *?(Ti|XT)?/i)
    ?.slice(1)
    .filter(Boolean)
    .map(((n, i) => n.toLowerCase() == "ti" ? "Ti" : n.toUpperCase()))
    .join(' ')
}