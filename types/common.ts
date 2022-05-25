export interface IGraka {
  name: string
  price: number
}

export abstract class Scraper {
  abstract name: string
  abstract display: string
  abstract link: string
  abstract color: string
  abstract scrape(): Promise<IGraka[]>
}