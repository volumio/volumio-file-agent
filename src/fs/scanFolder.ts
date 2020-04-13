import { Either, isLeft, left, right } from 'fp-ts/lib/Either'
import path from 'path'
import now from 'performance-now'

import { readdir } from './readdir'
import { stat } from './stat'

export const scanFolder = async (
  folderAbsolutePath: string,
): Promise<
  Either<NodeJS.ErrnoException | 'NOT_A_FOLDER', ScanFolderResult>
> => {
  const startTime = now()

  const statResult = await stat(folderAbsolutePath)

  if (isLeft(statResult)) {
    return statResult
  }

  if (statResult.right.isDirectory() === false) {
    return left('NOT_A_FOLDER')
  }

  const contentsResult = await readdir(folderAbsolutePath)

  if (isLeft(contentsResult)) {
    return contentsResult
  }

  const exceptionsByPath: ScanFolderResult['exceptionsByPath'] = {}
  const files: ScanFolderResult['files'] = []
  const subfolders: ScanFolderResult['subfolders'] = []

  await Promise.all(
    contentsResult.right.map(async (childName) => {
      const childAbsolutePath = path.resolve(folderAbsolutePath, childName)

      const statResult = await stat(childAbsolutePath)

      if (isLeft(statResult)) {
        exceptionsByPath[childAbsolutePath] = statResult.left
      } else {
        if (statResult.right.isDirectory()) {
          subfolders.push(childAbsolutePath)
        }

        if (statResult.right.isFile()) {
          files.push({
            folder: folderAbsolutePath,
            name: childName,
            size: statResult.right.size,
          })
        }
      }
    }),
  )

  files.sort((fileA, fileB) =>
    fileA.name < fileB.name ? -1 : fileA.name > fileB.name ? 1 : 0,
  )

  subfolders.sort()

  return right({
    duration: now() - startTime,
    exceptionsByPath,
    files,
    subfolders,
  })
}

export type ScanFolderResult = {
  duration: number
  exceptionsByPath: Record<string, NodeJS.ErrnoException>
  files: ScanFolderFile[]
  subfolders: string[]
}

export type ScanFolderFile = {
  folder: string
  name: string
  size: number
}
