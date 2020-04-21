import { FilesystemPort } from '@ports/Filesystem'
import { left, right } from 'fp-ts/lib/Either'
import fs from 'fs'

export const isDirectory: FilesystemPort['isDirectory'] = (path) =>
  new Promise((resolve) => {
    fs.stat(path, (error, stats) => {
      if (error) {
        resolve(left(error))
      } else {
        resolve(right(stats.isDirectory()))
      }
    })
  })
