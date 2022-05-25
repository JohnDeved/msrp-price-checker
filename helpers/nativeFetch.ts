import { IncomingMessage } from 'http'
import { OutgoingHttpHeaders } from 'http2'
import https from 'https'

interface INativeFetchOptions {
  method?: string
  body?: string
  headers?: OutgoingHttpHeaders
}

function nativeFetchReturn(bodyBuffer: Buffer, res: IncomingMessage) {
  return {
    res,
    status: res.statusCode,
    headers: res.headers,
    body: bodyBuffer.toString(),
    buffer: bodyBuffer,
    json: <T>() => JSON.parse(bodyBuffer.toString()) as T,
  }
}

export function nativeFetch(url: string, options?: INativeFetchOptions): Promise<ReturnType<typeof nativeFetchReturn>> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)

    const httpsOptions: https.RequestOptions = {
      method: options?.method ?? 'GET',
      hostname: parsedUrl.host,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: options?.headers
    }

    const req = https.request(httpsOptions, res => {
      const chunks: Buffer[] = []

      res.on("data", (chunk: Buffer) => {
        chunks.push(chunk)
      })

      res.on("end", () => {
        resolve(nativeFetchReturn(Buffer.concat(chunks), res))
      })

      res.on("error", err => {
        reject(err)
      })
    })

    if (options?.body) {
      req.write(options.body)
    }

    req.end()
  })
}