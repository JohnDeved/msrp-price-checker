import * as cheerio from 'cheerio'
import { dedupeGrakas, filterMsrp, sortGrakas } from "../../helpers/filters"
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
            name: $(el).find('.component-headline').text().trim().match(/(GTX|RTX|RX) \d{2,8}( Ti| XT)?/i)?.at(0) ?? '',
            price: parseFloat($(el).find('.components-price').text().trim().replaceAll(/[^0-9,]/g, '').replaceAll(',', '.'))
          }))
          .filter(g => g.name) // filter out undefined
      })
      .then(dedupeGrakas)
      .then(filterMsrp)
      .then(sortGrakas)
      .then(grakas => ({
        source: this.name,
        data: grakas
      }))
  }
}

export default new MemoryPC()