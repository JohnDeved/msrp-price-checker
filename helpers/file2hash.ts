import fs from 'fs'
import crypto from 'crypto'

export function getFileHash (file: string) {
  const hash = crypto.createHash('sha256')
  hash.update(fs.readFileSync(file))
  return hash.digest('hex')
}