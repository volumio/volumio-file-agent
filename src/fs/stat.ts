import { Either, left, right } from 'fp-ts/lib/Either'
import fs from 'fs'

export const stat = (
  path: string,
): Promise<Either<NodeJS.ErrnoException, fs.Stats>> =>
  new Promise((resolve) => {
    fs.stat(path, (err, stats) => {
      resolve(err ? left(err) : right(stats))
    })
  })
