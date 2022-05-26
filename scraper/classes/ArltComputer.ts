import * as cheerio from "cheerio"
import msrp, { msrpCards } from "../../helpers/msrp"
import { priceToNumber } from "../../helpers/price"
import { IGraka, Scraper } from "../../types/common"
import { formatGrakaName } from "../../helpers/grakaName"
import { dedupeGrakas, filterMsrp } from "../../helpers/filters"

class ArltComputer implements Scraper {
  name = 'arlt-computer' as const
  display = 'Arlt Computer' as const
  link = 'https://www.arlt.com/'
  color = '#D53F8C'

  async scrape() {
    return fetch("https://www.arlt.com/ARLT-PC-Konfigurator-AMD-Ryzen.html")
      .then(res => res.text())
      .then(html => {
        const $ = cheerio.load(html)
        return $('label:contains("Grafikkarte")')
          .next()
          .find('option')
          .toArray()
          .map<IGraka>(e => ({
            name: formatGrakaName(e.attribs["data-title"]) ?? '',
            price: priceToNumber(e.attribs["data-price"]),
          }))
      })
      .then(dedupeGrakas)
      .then(filterMsrp)
  }
}

export default new ArltComputer()