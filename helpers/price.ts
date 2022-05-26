export function priceToNumber(price: string): number {
  return parseFloat(price.trim().replaceAll(/[^\-0-9,]/g, '').replaceAll(',', '.'))
}