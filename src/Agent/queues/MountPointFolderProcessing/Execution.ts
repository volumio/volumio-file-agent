import { AsyncResultIterator } from 'async'
import { Either, isLeft, right } from 'fp-ts/lib/Either'
import { uniq } from 'lodash'
import path from 'path'
import now from 'performance-now'

import { FileStat, FilesystemPort } from '../../ports/Filesystem'
import {
  MediaFile,
  MediaFileBinaryProcessingStatus,
  PersistencyPort,
} from '../../ports/Persistency'

export const Execution = ({
  enqueueMediaFileProcessing,
  fs,
  persistency,
}: Dependencies): AsyncResultIterator<
  MountPointFolderToProcess,
  ExecutionReport,
  never
> => async (folderToProcess, done) => {
  const start = now()

  /**
   * Fetch MediaFiles actually stored on DB
   */
  const getFolderFilesResult = await persistency.getAllMediaFilesInFolder(
    folderToProcess.folder,
  )
  if (isLeft(getFolderFilesResult)) {
    return done(null, {
      duration: getDurationFrom(start),
      result: getFolderFilesResult,
    })
  }
  const { right: mediaFilesInDB } = getFolderFilesResult
  const mediaFilesInDBByName = mediaFilesInDB.reduce<
    Record<string, MediaFile | undefined>
  >((dict, mediaFile) => {
    dict[mediaFile.name] = mediaFile
    return dict
  }, Object.create(null))

  /**
   * Gather `stat` of every file to process
   */
  const statsByFileName = (
    await Promise.all(
      uniq(folderToProcess.fileNames).map(async (fileName) => {
        const statResult = await fs.statFile(
          path.resolve(folderToProcess.folder, fileName),
        )
        if (isLeft(statResult)) {
          return null
        } else {
          return {
            fileName,
            stat: statResult.right,
          }
        }
      }),
    )
  ).reduce<Record<string, FileStat | undefined>>((dict, result) => {
    if (result !== null) {
      dict[result.fileName] = result.stat
    }
    return dict
  }, Object.create(null))
  const fileNames = Object.keys(statsByFileName)

  /**
   * Calculate the files to add to DB as pending
   */
  const fileNamesToAddToDB = fileNames.filter((fileName) => {
    const mediaFileInDB = mediaFilesInDBByName[fileName]
    if (mediaFileInDB === undefined) {
      return true
    }

    const fileStat = statsByFileName[fileName] as FileStat
    if (
      mediaFileInDB.processingStatus === MediaFileBinaryProcessingStatus.DONE &&
      fileStat.size === mediaFileInDB.size &&
      fileStat.modifiedOn.getTime() === mediaFileInDB.modifiedOn.getTime()
    ) {
      return false
    }

    return true
  })

  /**
   * Filter out the MediaFiles in DB which should be deleted
   */
  const mediaFilesInDBToDelete = mediaFilesInDB.filter(
    ({ name }) => fileNames.includes(name) === false,
  )

  const result = {
    deletedMediaFiles: [] as MediaFile[],
    updatedMediaFiles: [] as MediaFile[],
  }

  /**
   * Delete from DB
   */
  if (mediaFilesInDBToDelete.length) {
    const deletionResult = await persistency.deleteMediaFiles(
      mediaFilesInDBToDelete.map(({ mountPoint, folder, name }) => ({
        mountPoint,
        folder,
        name,
      })),
    )
    if (isLeft(deletionResult)) {
      return done(null, {
        duration: getDurationFrom(start),
        result: deletionResult,
      })
    }
    result.deletedMediaFiles = mediaFilesInDBToDelete
  }

  /**
   * Update DB with new (or updated) PENDING files
   */
  if (fileNamesToAddToDB.length) {
    const additionResult = await persistency.addPendingMediaFiles({
      mountPoint: folderToProcess.mountPoint,
      folder: folderToProcess.folder,
      files: fileNamesToAddToDB.map((name) => {
        const stat = statsByFileName[name] as FileStat
        return {
          name,
          modifiedOn: stat.modifiedOn,
          size: stat.size,
        }
      }),
    })
    if (isLeft(additionResult)) {
      return done(null, {
        duration: getDurationFrom(start),
        result: additionResult,
      })
    }

    const { right: updatedMediaFiles } = additionResult

    /**
     * ...and enqueue them for processing
     */
    updatedMediaFiles.forEach(enqueueMediaFileProcessing)

    result.updatedMediaFiles = updatedMediaFiles
  }

  done(null, {
    duration: getDurationFrom(start),
    result: right(result),
  })
}

const getDurationFrom = (start: number) => now() - start

export type MountPointFolderToProcess = {
  mountPoint: string
  folder: string
  fileNames: string[]
}

export type ExecutionReport = {
  duration: number
  result: Either<
    'PERSISTENCY_FAILURE',
    {
      deletedMediaFiles: MediaFile[]
      updatedMediaFiles: MediaFile[]
    }
  >
}

export type Dependencies = {
  enqueueMediaFileProcessing: (mediaFile: MediaFile) => void
  fs: FilesystemPort
  persistency: PersistencyPort
}
