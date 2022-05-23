import * as cheerio from 'cheerio'
import msrp from "../../helpers/msrp"
import { Scraper } from "../../types/common"

class CaseKing implements Scraper {
  name = 'caseking' as const
  display = 'CaseKing' as const
  link = 'https://www.caseking.de'
  color = '#FFCD00'

  async scrape() {
    const cards = Object.keys(msrp)
      .filter(k => msrp[k as keyof typeof msrp]) // filter out cards without msrp

    const cardPrefix = (n: string) => {
      if (n.startsWith('RTX')) return 'nvidia/geforce-' + n.toLowerCase().replaceAll(' ', '-')
      if (n.startsWith('RX')) return 'amd/radeon-' + n.toLowerCase().replaceAll(' ', '-')
      return n
    }

    return Promise.all(cards.map((card) => {
      return fetch(`https://www.caseking.de/pc-komponenten/grafikkarten/${cardPrefix(card)}?sSort=3`)
        .then(response => response.text())
        .then(html => {
          const $ = cheerio.load(html)

          return {
            name: card,
            price: parseFloat($("span.price").first().text().trim().replaceAll(/[^0-9,]/g, '').replaceAll(',', '.'))
          }
        })
    })).then(data => ({
      source: this.name,
      data
    }))
  }
}

export default new CaseKing()