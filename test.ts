import { scrapers } from "./scraper"

const scraperName = process.argv[2] ?? ''

scrapers.find(s => s.name.includes(scraperName))?.scrape()
  .then(console.log)
  .catch(console.error)