import cookie from "cookie";
import https from "https";
import msrp, { msrpCards } from "../../helpers/msrp";
import { nativeFetch } from "../../helpers/nativeFetch";
import { IGraka, Scraper } from "../../types/common";

const CLS = {
  NVIDIA: 41,
  AMD: 42,
}

interface IClsProduct {
  p_name: string
  p_price: number
}

interface IClsPage {
  total: number
  page: number
  pages: number
  products: IClsProduct[]
}

class ClsComputer implements Scraper {
  name = 'cls-computer' as const
  display = 'CLS Computer' as const
  link = 'https://cls-computer.de'
  color = "#38A169"

  async scrape() {
    // get cookies with custom https request, because native node fetch doesnt seem to get https-only cookies
    const { cookies, formkey } = await nativeFetch('https://cls-computer.de/mega-search/cart/update', {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      }
    }).then(res => {
      const setCookies = cookie.parse(res.headers["set-cookie"]?.join("; ") ?? "")
      const cookies = `PHPSESSID=${setCookies.PHPSESSID}; private_content_version=${setCookies.private_content_version}`

      const json = res.json<{ formkey: string }>()
      const formkey = json.formkey
      return { cookies, formkey };
    })

    const fetchAllPages = async (type: number, page = 1, pages?: number): Promise<IClsProduct[]> => {
      // little hack to get all requests promises in one array
      const requests = new Array(pages ?? 1).fill(null).map(() => {
        // also doenst work with native node fetch for some reason, so use custom https request
        return nativeFetch('https://cls-computer.de/pc-konfigurator/index/product/', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies,
        },
        body: `form_key=${formkey}&id=${type}&page=${page}`
      })
        .then(res => res.json<IClsPage>())
        .then(async json => {
          if (!pages) {
            // run the rest of the pages in parallel instead of sequentially, makes code a little less readable but faster
            const rest = await fetchAllPages(type, page + 1, json.pages)
            return [...json.products, ...rest]
          }

          return json.products
        })
      })

      // makes all requests run in parallel
      return Promise.all(requests).then(res => res.flat())
    }

    // fetches both categories in parallel
    const products = await Promise.all(Object.values(CLS)
        .map(type => fetchAllPages(type)))
        .then(res => res.flat())
        .then(prod => prod.sort((a, b) => a.p_price - b.p_price)) // sort by price ascending, so .find will get the cheapest one 
    
    return msrpCards.map(card => {
      const found = products.find(p => p.p_name.includes(card))
      if (found) {
        const graka: IGraka = {
          name: card,
          price: found.p_price,
        }
        
        return graka
      }
    })
      // typeguard filter out undefineds
      .filter((g): g is NonNullable<typeof g> => Boolean(g))
  }
}

export default new ClsComputer()