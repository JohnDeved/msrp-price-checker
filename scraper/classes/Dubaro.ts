import * as cheerio from "cheerio"
import { dedupeGrakas } from "../../helpers/filters"
import { formatGrakaName } from "../../helpers/grakaName"
import { convertPriceToNumber } from "../../helpers/price"
import { IGraka, Scraper } from "../../types/common"

class Dubaro implements Scraper {
  name = 'dubaro' as const
  display = 'Dubaro' as const
  link = 'https://www.dubaro.de'
  color = "#000"

  async scrape() {
    
    const fetchFromProduct = (url: string) => {
      return fetch(url)
        .then(res => res.text())
        .then<IGraka[]>(html => {
          const $ = cheerio.load(html)
          const basePrice = convertPriceToNumber($('ul:contains("NVIDIA")').first().parent().find('.mixxxer_item_box:contains("ohne") .mi_line_price').text())
          const items = $('ul:contains("NVIDIA")').first().parent().find(".mixxxer_group_line").map((i, el) => {
            return {
              name: formatGrakaName($(el).text().trim()) ?? '',
              price: Number(((convertPriceToNumber($(el).next().find(".mi_line_price").text()) + Math.abs(basePrice)) * 1.2).toFixed())
            }
          })
          
          return items.toArray()
        })
    }

    const requests = [
      "https://www.dubaro.de/mixxxer.php?products_id=3583", // lowend cards
      "https://www.dubaro.de/mixxxer.php?products_id=4531", // highend cards
    ].map(url => fetchFromProduct(url))

    return await Promise.all(requests)
      .then(i => i.flat())
      .then(dedupeGrakas)
  }
}

export default new Dubaro()