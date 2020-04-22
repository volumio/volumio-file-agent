import { MountPointFolderProcessingQueue } from '@Agent/queues/MountPointFolderProcessing'
import { FilesystemPort } from '@ports/Filesystem'
import { AsyncResultIterator } from 'async'
import { isRight } from 'fp-ts/lib/Either'
import now from 'performance-now'

import { MEDIA_FILE_EXTENSIONS } from '../../constants'

export const Execution = ({
  fs,
  processFolder,
}: Dependencies): AsyncResultIterator<string, ExecutionReport, never> => async (
  mountPoint,
  done,
) => {
  const start = now()

  // Scan files under MountPoint
  const found = await fs.findFilesInTree(mountPoint, MEDIA_FILE_EXTENSIONS)

  const reports = await Promise.all(
    found.folders.map((folder) =>
      processFolder({
        mountPoint,
        folder: folder.path,
        fileNames: folder.fileNames,
      }),
    ),
  )

  const folderProcessingResults = reports.map(({ result }) => result)
  const successfulFolderProcessingResults = folderProcessingResults
    .filter(isRight)
    .map((result) => result.right)

  done(null, {
    duration: getDurationFrom(start),
    foundFiles: found.totalFiles,
    ...successfulFolderProcessingResults.reduce<{
      deletedMediaFilesFromDB: number
      updatedMediaFilesOnDB: number
    }>(
      (total, result) => {
        total.deletedMediaFilesFromDB += result.deletedMediaFiles.length
        total.updatedMediaFilesOnDB += result.updatedMediaFiles.length
        return total
      },
      {
        deletedMediaFilesFromDB: 0,
        updatedMediaFilesOnDB: 0,
      },
    ),
  })
}

const getDurationFrom = (start: number) => now() - start

export type ExecutionReport = {
  duration: number
  foundFiles: number
  deletedMediaFilesFromDB: number
  updatedMediaFilesOnDB: number
}

export type Dependencies = {
  fs: FilesystemPort
  processFolder: MountPointFolderProcessingQueue['add']
}
