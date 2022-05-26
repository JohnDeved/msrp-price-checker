import { dedupeGrakas, filterMsrp, sortGrakas } from "../../helpers/filters"
import { formatGrakaName } from "../../helpers/grakaName"
import { Scraper } from "../../types/common"

class Mifcom implements Scraper {
  name = 'mifcom' as const
  display = 'Mifcom' as const
  link = 'https://www.mifcom.de'
  color = '#E53E3E'

  async scrape() {
    return fetch("https://www.mifcom.de/gaming-pc-konfigurator-amd-ryzen-5000-so-am4-id13616?configurator")
      .then(response => response.text())
      .then(html => {
        const match = html.match(/Bundle\((.+)\);\n/)
        const bundle: Record<string, Object> = JSON.parse(match?.[1] ?? '{}')
        return Object.values(bundle.options).find(o => o.title === "Grafikkarte").selections as Object
      })
      .then(grakas => {
        // filter and map for RTX cards
        return Object.values(grakas)
          .map(g => ({ name: g.name as string, price: g.priceInclTax as number }))
          .map(g => ({ ...g, name: formatGrakaName(g.name) ?? '' }))
          .filter(g => g.name) // filter out empty names
      })
      .then(dedupeGrakas)
      .then(filterMsrp)
      .then(sortGrakas)
  }
}

export default new Mifcom()