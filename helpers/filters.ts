import { IGraka } from "../types/common"
import msrp from "./msrp"

export function dedupeGrakas(grakas: IGraka[]) {
  return grakas.reduce((acc, curr) => {
    const existing = acc.find(g => g.name === curr.name)
    if (existing) {
      if (curr.price < existing.price) {
        acc.splice(acc.indexOf(existing), 1, curr)
      }
    } else {
      acc.push(curr)
    }
    return acc
  }, [] as typeof grakas)
}

export function sortGrakas(grakas: IGraka[]) {
  return grakas.sort((a, b) => a.price - b.price)
}

export function filterMsrp(grakas: IGraka[]) {
  return grakas
    .filter(g => {
      // remove cards without msrp
      const key = g.name as keyof typeof msrp
      if (!msrp[key]) msrp[key] = null as never
      return msrp[key]
    })
}