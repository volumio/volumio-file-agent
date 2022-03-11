import { FilesystemPort } from '@Agent/ports/Filesystem'
import { isLeft, isRight, left, right } from 'fp-ts/lib/Either'
import fs from 'fs'
import path from 'path'

import { isDirectory } from './isDirectory'

export const findDirectorySubDirectories: FilesystemPort['findDirectorySubDirectories'] = async (
  dirPath,
) => {
  const isDirectoryResult = await isDirectory(dirPath)

  if (isLeft(isDirectoryResult)) {
    return isDirectoryResult
  }

  return new Promise((resolve) => {
    fs.readdir(dirPath, async (error, files) => {
      if (error) {
        resolve(left(error))
      }

      const subDirectories: string[] = []

      await files.reduce(async (prev, file) => {
        await prev
        const filePath = path.resolve(dirPath, file)
        const isDirectoryResult = await isDirectory(filePath)

        if (isRight(isDirectoryResult) && isDirectoryResult.right === true) {
          subDirectories.push(filePath)
        }
      }, Promise.resolve())

      resolve(right(subDirectories.sort()))
    })
  })
}
