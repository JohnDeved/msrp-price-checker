import { scrapeData } from './scraper'
import { updateCharts } from './scripts/updateCharts'
import { updatePrices } from './scripts/updatePrices'
import { updateReadme } from './scripts/updateReadme'

scrapeData().then((newData) => {
  console.log(newData)

  updatePrices(newData)
  updateCharts(newData)
  updateReadme(newData)

  // to scrape graka
  // https://cls-computer.de/pc-konfigurator/
})