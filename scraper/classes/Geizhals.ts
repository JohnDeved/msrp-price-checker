import { msrpCards } from "../../helpers/msrp"
import { Scraper } from "../../types/common"
import * as cheerio from "cheerio"
import { priceToNumber } from "../../helpers/price"

class Geizhals implements Scraper {
  name = 'geizhals' as const
  display = 'Geizhals (HW Stores)'
  link = 'https://geizhals.at/?sort=p&hloc=at&hloc=de&hloc=eu&hloc=pl&hloc=uk&cat=gra16_512'
  color = '#CBD5E0'

  async scrape() {
    return Promise.all(msrpCards.map(card => {
      return fetch(`https://geizhals.at/?sort=p&hloc=at&hloc=de&hloc=eu&hloc=pl&hloc=uk&cat=gra16_512&fs="${card}"`)
        .then(response => response.text())
        .then(html => {
          const $ = cheerio.load(html)

          return {
            name: card,
            price: priceToNumber($('.price').first().text()),
          }
        })
    }))
  }
}

export default new Geizhals()