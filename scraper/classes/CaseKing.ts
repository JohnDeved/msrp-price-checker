import * as cheerio from 'cheerio'
import { msrpCards } from "../../helpers/msrp"
import { priceToNumber } from '../../helpers/price'
import { Scraper } from "../../types/common"

class CaseKing implements Scraper {
  name = 'caseking' as const
  display = 'CaseKing' as const
  link = 'https://www.caseking.de/pc-systeme/finder/pc-konfigurator'
  color = '#D69E2E'

  async scrape() {
    const cardPrefix = (n: string) => {
      if (n.startsWith('RTX')) return 'nvidia/geforce-' + n.toLowerCase().replaceAll(' ', '-')
      if (n.startsWith('RX')) return 'amd/radeon-' + n.toLowerCase().replaceAll(' ', '-')
      return n
    }

    return Promise.all(msrpCards.map((card) => {
      return fetch(`https://www.caseking.de/pc-komponenten/grafikkarten/${cardPrefix(card)}?sSort=3`)
        .then(response => response.text())
        .then(html => {
          const $ = cheerio.load(html)

          return {
            name: card,
            price: priceToNumber($("span.price").first().text())
          }
        })
    }))
  }
}

export default new CaseKing()