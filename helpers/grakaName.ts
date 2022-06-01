export function formatGrakaName(name: string) {
  return name.trim()
    .match(/(GTX|RTX|RX) *(?!\d0{3})(\d{4}) *(Ti|XT)?/i)
    ?.slice(1)
    .filter(Boolean)
    .map(((n, i) => n.toLowerCase() === "ti" ? "Ti" : n.toUpperCase()))
    .join(' ')
}