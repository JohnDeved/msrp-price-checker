import { ChartJSNodeCanvas } from "chartjs-node-canvas"
import path from "path"
import msrp from "../helpers/msrp"
import { TScraperNames, getScraperColors } from "../scraper"
import { IGraka } from "../types/common"
import { getPrices } from "./updatePrices"
import fs from "fs"
import { getGrakaReadmeData } from "./updateReadme"

const chartJSNodeCanvas = new ChartJSNodeCanvas({ type: 'svg', width: 800, height: 600 })

export function updateCharts(newData: Record<string, IGraka[]>) {
  const prices = getPrices()
  const dates = Object.keys(prices)
  const getPricesForGraka = (grakaName: string) => {
    const gotPrices = {} as Record<TScraperNames, number[]>
    for (const data of Object.values(prices)) {
      Object.keys(newData).forEach(name => {
        if (!gotPrices[name as TScraperNames]) gotPrices[name as TScraperNames] = []
        const price = data[name as TScraperNames]?.find(g => g.name === grakaName)?.price
        gotPrices[name as TScraperNames].push(price ?? NaN)
      })
    }

    return gotPrices
  }

  const getChartColor = (name: string) => {
    const colors = getScraperColors()
    return colors[name as TScraperNames] ?? '#000000'
  }

  const grakas = getGrakaReadmeData(newData)
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

    fs.writeFileSync(path.join(__dirname, '..', 'img', `${graka.name}.svg`), renderBuffer)
  }
}