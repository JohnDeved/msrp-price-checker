import { IGraka } from "../types/common";
import Alternate from "./classes/Alternate";
import CaseKing from "./classes/CaseKing";
import MemoryPC from "./classes/MemoryPC";
import Mifcom from "./classes/Mifcom";

export type TScraperNames = ReturnType<typeof getScraperNames>[0]

export const scrapers = [
  Mifcom,
  MemoryPC,
  Alternate,
  CaseKing,
]

export function getScraperNames () {
  return scrapers.map(s => s.name)
}

export function getScraperColors () {
  const names = getScraperNames()
  const colors = scrapers.map(s => s.color)
  return names.reduce((acc, name, i) => ({ ...acc, [name]: colors[i] }), {} as  Record<TScraperNames, string>)
}

export function scrapeData () {
  return Promise.allSettled([
    Mifcom.scrape(),
    MemoryPC.scrape(),
    Alternate.scrape(),
    CaseKing.scrape(),
  ]).then(res => {
    const data: Partial<Record<TScraperNames, IGraka[]>> = {}

    res.forEach(r => {
      if (r.status === 'fulfilled') {
        data[r.value.source] = r.value.data
      }
    })

    return data
  })
}
