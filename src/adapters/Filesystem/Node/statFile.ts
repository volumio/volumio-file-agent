import { FilesystemPort } from '@ports/Filesystem'
import { left, right } from 'fp-ts/lib/Either'
import fs from 'fs'

export const statFile: FilesystemPort['statFile'] = (path) =>
  new Promise((resolve) => {
    fs.stat(path, (error, stats) => {
      if (error) {
        resolve(left(error))
      } else {
        resolve(
          right({
            createdOn: new Date(stats.birthtimeMs),
            modifiedOn: new Date(stats.mtimeMs),
            size: stats.size,
          }),
        )
      }
    })
  })
