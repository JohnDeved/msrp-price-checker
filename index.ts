import { scrapeData } from './scraper'
import { updateCharts } from './scripts/updateCharts'
import { updatePrices } from './scripts/updatePrices'
import { updateReadme } from './scripts/updateReadme'

scrapeData().then((newData) => {
  console.log(newData)

  updatePrices(newData)
  updateReadme(newData)
  updateCharts(newData)
})