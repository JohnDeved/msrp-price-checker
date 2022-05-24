import dayjs from "dayjs"
import path from "path"
import msrp from "../helpers/msrp"
import { IGraka } from "../types/common"
import fs from "fs"

const pricesFile = path.join(__dirname, '..', 'data', 'prices.json')

export function getPrices () {
  const prices: Record<string, Record<string, IGraka[]>> = fs.existsSync(pricesFile) ? JSON.parse(fs.readFileSync(pricesFile, "utf8")) : {}
  return prices
}

export function updatePrices (newData: Record<string, IGraka[]>) {
  const date = dayjs().format("DD.MM.YYYY")
  const prices = getPrices()
  prices[date] = newData
  fs.writeFileSync(pricesFile, JSON.stringify(prices, null, 2))

  // update msrp file, this will add new cards to the file
  const msrpFile = path.join(__dirname, '..', 'data', 'msrp.json')
  fs.writeFileSync(msrpFile, JSON.stringify(msrp, Object.keys(msrp).sort(), 2))
}