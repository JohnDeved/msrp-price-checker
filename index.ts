import msrp from './data/msrp.json'
import dayjs from 'dayjs'
import fs from 'fs'
import * as cheerio from 'cheerio'
import path from 'path'
import Handlebars from 'handlebars'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
const chartJSNodeCanvas = new ChartJSNodeCanvas({ type: 'svg', width: 800, height: 600 })

interface IGraka {
  name: string
  price: number
}

function dedupeGrakas(grakas: IGraka[]) {
  return grakas.reduce((acc, curr) => {
    const existing = acc.find(g => g.name === curr.name)
    if (existing) {
      if (curr.price < existing.price) {
        acc.splice(acc.indexOf(existing), 1, curr)
      }
    } else {
      acc.push(curr)
    }
    return acc
  }, [] as typeof grakas)
}

function sortGrakas(grakas: IGraka[]) {
  return grakas.sort((a, b) => a.price - b.price)
}

function filterMsrp(grakas: IGraka[]) {
  return grakas
    .filter(g => {
      // remove cards without msrp
      const key = g.name as keyof typeof msrp
      if (!msrp[key]) msrp[key] = null as never
      return msrp[key]
    })
}


function scrapeMifcom() {
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
        .map(g => ({ name: g.name as string, price: g.price as number }))
        .map(g => ({ ...g, name: g.name.match(/(GTX|RTX|RX) \d{2,8}( Ti| XT)?/i)?.at(0) ?? '' }))
        .filter(g => g.name) // filter out empty names
    })
    .then(dedupeGrakas)
    .then(filterMsrp)
    .then(sortGrakas)
}

function scrapeMemoryPC() {
  return fetch("https://www.memorypc.de/configurator/aufruest-kit-msi-b550-a-pro-amd-ryzen-9-5900x-12x-3.70-ghz")
    .then(response => response.text())
    .then(html => {
      const $ = cheerio.load(html)
      return $('h2:contains("Grafikkarte")').parent().parent().find(".product--properties-label").toArray()
        .map((el) => ({
          name: $(el).find('.component-headline').text().trim().match(/(GTX|RTX|RX) \d{2,8}( Ti| XT)?/i)?.at(0) ?? '',
          price: parseFloat($(el).find('.components-price').text().trim().replace(/[^0-9,]/g, '').replace(',', '.'))
        }))
        .filter(g => g.name) // filter out undefined
    })
    .then(dedupeGrakas)
    .then(filterMsrp)
    .then(sortGrakas)
}

Promise.allSettled([
  scrapeMifcom(),
  scrapeMemoryPC()
]).then((results) => {
  const [mifcom, memorypc] = results.map(result => result.status === "fulfilled" ? result.value : null)

  const newData = { mifcom, memorypc }
  console.log(newData)

  const date = dayjs().format("DD.MM.YYYY")
  const file = path.join(__dirname, 'data', 'prices.json')
  const prices: Record<string, typeof newData> = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {}
  prices[date] = newData
  fs.writeFileSync(file, JSON.stringify(prices, null, 2))

  // update msrp file, this will add new cards to the file
  const msrpFile = path.join(__dirname, 'data', 'msrp.json')
  fs.writeFileSync(msrpFile, JSON.stringify(msrp, Object.keys(msrp).sort(), 2))

  // update readme
  const readmeTemplateFile = path.join(__dirname, 'templates', 'README.hbs')
  const readmeTemplate = Handlebars.compile(fs.readFileSync(readmeTemplateFile, "utf8"))

  const getFormatedPrices = (name: string, data: IGraka[]) => {
    const price = data.find(g => g.name === name)?.price
    const msrpPrice = msrp[name as keyof typeof msrp] ?? 0
    const msrpDiff = price && msrpPrice ? price - msrpPrice : 0

    return {
      price: price ? `${price.toFixed(2)}€` : "?",
      msrp: {
        diff: msrpDiff ? `${msrpDiff.toFixed(2)}€` : "?",
        perc: msrpDiff ? `${(msrpDiff / msrpPrice * 100).toFixed(2)}%` : "?",
        type: msrpDiff > 0 ? "over" : "under"
      }
    }
  }

  const grakas = dedupeGrakas([...mifcom ?? [], ...memorypc ?? []])
    .map(g => ({
      name: g.name,
      nameEnc: encodeURIComponent(g.name),
      msrp: msrp[g.name as keyof typeof msrp] + '€',
      price: [
        {
          name: "Mifcom",
          link: "https://www.mifcom.de",
          ...getFormatedPrices(g.name, mifcom ?? [])
        },
        {
          name: "MemoryPC",
          link: "https://www.memorypc.de",
          ...getFormatedPrices(g.name, memorypc ?? [])
        }
      ]
    }))

  console.log(JSON.stringify(grakas, null, 2))

  const readme = readmeTemplate({ grakas, date })
  const readmeFile = path.join(__dirname, 'README.md')
  fs.writeFileSync(readmeFile, readme)


  // render chart
  const dates = Object.keys(prices)
  const getPricesForGraka = (grakaName: string) => {
    type TKey = keyof typeof prices['']
    const gotPrices = {} as Record<TKey, number[]>
    for (const data of Object.values(prices)) {
      for (const [key, graka] of Object.entries(data)) {
        if (!graka) continue
        if (!gotPrices[key as TKey]) gotPrices[key as TKey] = []
        gotPrices[key as TKey].push(graka?.find(g => g.name === grakaName)?.price ?? 0)
      }
    }

    return gotPrices
  }

  const getChartColor = (name: string) => {
    if (name === "mifcom") return "#E53E3E"
    if (name === "memorypc") return "#3182CE"
    return "#000000"
  }

  for (const graka of grakas) {
    const renderBuffer = chartJSNodeCanvas.renderToBufferSync({
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: "msrp",
            data: new Array(dates.length).fill(msrp[graka.name as keyof typeof msrp]),
            fill: false,
            cubicInterpolationMode: 'monotone',
            borderColor: '#2D3748',
            tension: 0.4
          },
          ...Object.entries(getPricesForGraka(graka.name)).map(([company, prices]) => {
            return {
              label: company + ' - ' + graka.name,
              data: prices,
              fill: false,
              cubicInterpolationMode: 'monotone',
              borderColor: getChartColor(company),
              tension: 0.4
            }
          })
        ]
      },
      options: {
        responsive: true,
        interaction: {
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Price in €'
            },
            min: 0,
          }
        }
      },
    })

    fs.writeFileSync(path.join(__dirname, 'img', `${graka.name}.svg`), renderBuffer)
  }
})