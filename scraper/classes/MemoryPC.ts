import * as cheerio from 'cheerio'
import { dedupeGrakas, filterMsrp, sortGrakasByName } from "../../helpers/filters"
import { formatGrakaName } from '../../helpers/grakaName'
import { priceToNumber } from '../../helpers/price'
import { Scraper } from "../../types/common"

class MemoryPC implements Scraper {
  name = 'memorypc' as const
  display = 'MemoryPC' as const
  link = 'https://www.memorypc.de'
  color = "#3182CE"

  async scrape() {
    return fetch("https://www.memorypc.de/configurator/aufruest-kit-msi-b550-a-pro-amd-ryzen-9-5900x-12x-3.70-ghz")
      .then(response => response.text())
      .then(html => {
        const $ = cheerio.load(html)
        return $('h2:contains("Grafikkarte")').parent().parent().find(".product--properties-label").toArray()
          .map((el) => ({
            name: formatGrakaName($(el).find('.component-headline').text()) ?? '',
            price: priceToNumber($(el).find('.components-price').text())
          }))
          .filter(g => g.name) // filter out undefined
      })
      .then(dedupeGrakas)
      .then(filterMsrp)
      .then(sortGrakasByName)
  }
}

export default new MemoryPC()