import path from "path"
import msrp from "../helpers/msrp"
import { IGraka } from "../types/common"
import fs from "fs"
import { scrapers } from "../scraper"
import dayjs from "dayjs"
import Handlebars from "handlebars"
import { getFileHash } from "../helpers/file2hash"

export const getFormatedPrices = (name: string, data: IGraka[]) => {
  const price = data.find(g => g.name === name)?.price
  const msrpPrice = msrp[name as keyof typeof msrp] ?? NaN
  const msrpDiff = price && msrpPrice ? price - msrpPrice : NaN

  return {
    price: price ? `${price.toFixed(2)}€` : "?",
    msrp: {
      diff: msrpDiff ? `${msrpDiff.toFixed(2)}€` : "?",
      perc: msrpDiff ? `${(msrpDiff / msrpPrice * 100).toFixed(2)}%` : "?",
      type: msrpDiff > 0 ? "over" : "under"
    }
  }
}

export function getGrakaReadmeData(newData: Record<string, IGraka[]>, includeHash: boolean = false) {
  return Object.keys(msrp).filter(name => msrp[name as keyof typeof msrp])
    .map(name => ({
      name,
      nameEnc: encodeURIComponent(name),
      ... includeHash ? { imageHash: getFileHash(path.join(__dirname, "../img", `${name}.svg`)) } : {},
      msrp: msrp[name as keyof typeof msrp] + '€',
      price: scrapers.map(scraper => ({
        name: scraper.display,
        link: scraper.link,
        ...getFormatedPrices(name, newData[scraper.name] ?? [])
      }))
    }))
}

export function updateReadme(newData: Record<string, IGraka[]>) {
  const date = dayjs().format("DD.MM.YYYY")
  const readmeTemplateFile = path.join(__dirname, '..', 'templates', 'README.hbs')
  const readmeTemplate = Handlebars.compile(fs.readFileSync(readmeTemplateFile, "utf8"))

  const grakas = getGrakaReadmeData(newData)
  console.log(JSON.stringify(grakas, null, 2))

  const readme = readmeTemplate({ grakas, date })
  const readmeFile = path.join(__dirname, '..', 'README.md')
  fs.writeFileSync(readmeFile, readme)
}