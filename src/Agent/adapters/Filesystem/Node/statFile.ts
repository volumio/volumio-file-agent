import { left, right } from 'fp-ts/lib/Either'
import fs from 'fs'

import { FilesystemPort } from '../../../ports/Filesystem'
import { debug } from './debug'

export const statFile: FilesystemPort['statFile'] = (path) =>
  new Promise((resolve) => {
    fs.stat(path, (error, stats) => {
      if (error) {
        debug.error &&
          debug.error(`[RESULT] statFile(%s) error: %s`, path, error.message)
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
