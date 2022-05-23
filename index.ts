import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import dayjs from 'dayjs'
import fs from 'fs'
import Handlebars from 'handlebars'
import path from 'path'
import { dedupeGrakas } from './helpers/filters'
import msrp from './helpers/msrp'
import { getScraperColors, scrapeData, scrapers, TScraperNames } from './scraper'
import { IGraka } from './types/common'
const chartJSNodeCanvas = new ChartJSNodeCanvas({ type: 'svg', width: 800, height: 600 })

scrapeData().then((newData) => {
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
    const msrpPrice = msrp[name as keyof typeof msrp] ?? NaN
    const msrpDiff = price && msrpPrice ? price - msrpPrice : NaN

    return {
      price: price ? `${price.toFixed(2)}€` : "?",
      msrp: {
        diff: msrpDiff ? `${msrpDiff.toFixed(2)}€` : "?",
        perc: msrpDiff ? `${(msrpDiff / msrpPrice * 100).toFixed(2)}%` : "?",
        type: msrpDiff > 0 ? "over" : "under"
      }
    }
  }

  const grakas = Object.keys(msrp).filter(name => msrp[name as keyof typeof msrp])
    .map(name => ({
      name,
      nameEnc: encodeURIComponent(name),
      msrp: msrp[name as keyof typeof msrp] + '€',
      price: scrapers.map(scraper => ({
        name: scraper.display,
        link: scraper.link,
        ...getFormatedPrices(name, newData[scraper.name] ?? [])
      }))
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
      Object.keys(newData).forEach(name => {
        if (!gotPrices[name as TKey]) gotPrices[name as TKey] = []
        const price = data[name as TKey]?.find(g => g.name === grakaName)?.price
        gotPrices[name as TKey].push(price ?? NaN)
      })
    }

    return gotPrices
  }

  const getChartColor = (name: string) => {
    const colors = getScraperColors()
    return colors[name as TScraperNames] ?? '#000000'
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