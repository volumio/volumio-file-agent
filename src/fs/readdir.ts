import { Either, left, right } from 'fp-ts/lib/Either'
import fs from 'fs'

export const readdir = (
  path: string,
): Promise<Either<NodeJS.ErrnoException, string[]>> =>
  new Promise((resolve) => {
    fs.readdir(path, (err, files) => {
      resolve(err ? left(err) : right(files))
    })
  })
