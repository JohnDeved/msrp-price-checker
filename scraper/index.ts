import { IGraka } from "../types/common";
import Alternate from "./classes/Alternate";
import ArltComputer from "./classes/ArltComputer";
import CaseKing from "./classes/CaseKing";
import ClsComputer from "./classes/ClsComputer";
import Dubaro from "./classes/Dubaro";
import MemoryPC from "./classes/MemoryPC";
import Mifcom from "./classes/Mifcom";

export type TScraperNames = ReturnType<typeof getScraperNames>[0]

export const scrapers = [
  Mifcom,
  MemoryPC,
  Alternate,
  CaseKing,
  ClsComputer,
  Dubaro,
  ArltComputer
]

// https://www.vergleich.org/pc-konfigurator/
// https://www.pcspecialist.at/computer/amd-am4-overclocked/
// https://www.ditech.at/pckonfi.php?artnr=201661&belnr=A%207241807
// https://www.alza.at/komponentenmontage-d70319.htm?o=2
// https://www.ibuypower.de/Gamer-PC/AMD-Ryzen-5-Gamer-PC
// https://www.one.de/one-gaming-pc-premium-in03-frei-anpassen-intel-nvidia

export function getScraperNames() {
  return scrapers.map(s => s.name)
}

export function getScraperColors() {
  const names = getScraperNames()
  const colors = scrapers.map(s => s.color)
  return names.reduce((acc, name, i) => ({ ...acc, [name]: colors[i] }), {} as Record<TScraperNames, string>)
}

export function scrapeData() {
  console.time("scrapeData all")
  return Promise.allSettled(scrapers.map(async s => {

    console.time(`scrapeData ${s.name}`)
    const data = await s.scrape()
    console.timeEnd(`scrapeData ${s.name}`)

    return { data, source: s.name }
  })).then(res => {
    console.timeEnd("scrapeData all")
    const data: Partial<Record<TScraperNames, IGraka[]>> = {}

    res.forEach(r => {
      if (r.status === 'fulfilled') {
        data[r.value.source] = r.value.data
      } else {
        console.error(r.reason)
      }
    })

    return data
  })
}
