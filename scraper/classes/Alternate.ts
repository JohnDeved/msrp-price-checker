import * as cheerio from "cheerio"
import msrp from "../../helpers/msrp"
import { Scraper } from "../../types/common"

class Alternate implements Scraper {
  name = 'alternate' as const
  display = 'Alternate' as const
  link = 'https://www.alternate.de/PC-Konfigurator'
  color = '#DD6B20'

  async scrape() {
    const cards = Object.keys(msrp)
      .filter(k => msrp[k as keyof typeof msrp]) // filter out cards without msrp

    const cardPrefix = (n: string) => {
      if (n.startsWith('RTX')) return 'NVIDIA GeForce ' + n
      if (n.startsWith('RX')) return 'AMD Radeon ' + n
      return n
    }

    return Promise.all(cards.map(card => {
      return fetch(`https://www.alternate.de/Grafikkarten?filter_2203=${cardPrefix(card)}&s=price_asc`)
        .then(response => response.text())
        .then(html => {
          const $ = cheerio.load(html)

          return {
            name: card,
            price: parseFloat($('.price').first().text().trim().replaceAll(/[^0-9,]/g, '').replaceAll(',', '.'))
          }
        })
    }))
  }
}

export default new Alternate()