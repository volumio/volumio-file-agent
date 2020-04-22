import { DatabasePort, MediaFile } from '@ports/Database'
import { FileStat, FilesystemPort } from '@ports/Filesystem'
import { AsyncResultIterator } from 'async'
import { Either, isLeft, right } from 'fp-ts/lib/Either'
import { uniq } from 'lodash'
import path from 'path'
import now from 'performance-now'

export const Execution = ({
  db,
  fs,
}: Dependencies): AsyncResultIterator<
  MountPointFolderToProcess,
  ExecutionReport,
  never
> => async (folderToProcess, done) => {
  const start = now()

  /**
   * Fetch MediaFiles actually stored on DB
   */
  const getFolderFilesResult = await db.getMediaFilesInFolder({
    mountPoint: folderToProcess.mountPoint,
    folder: folderToProcess.folder,
  })
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
    dict[mediaFile.id.name] = mediaFile
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
      fileStat.size === mediaFileInDB.binary.size &&
      fileStat.modifiedOn.getTime() ===
        mediaFileInDB.binary.modifiedOn.getTime()
    ) {
      return false
    }

    return true
  })

  /**
   * Filter out the MediaFiles in DB which should be deleted
   */
  const mediaFilesInDBToDelete = mediaFilesInDB.filter(
    ({ id: { name } }) => fileNames.includes(name) === false,
  )

  const result = {
    deletedMediaFiles: [] as MediaFile[],
    updatedMediaFiles: [] as MediaFile[],
  }

  /**
   * Delete from DB
   */
  if (mediaFilesInDBToDelete.length) {
    const deletionResult = await db.deleteMediaFiles(
      mediaFilesInDBToDelete.map(({ id }) => id),
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
   * Update DB with new PENDING files
   */
  if (fileNamesToAddToDB.length) {
    const additionResult = await db.addPendingMediaFilesToFolder(
      {
        mountPoint: folderToProcess.mountPoint,
        folder: folderToProcess.folder,
      },
      fileNamesToAddToDB.map((name) => {
        const stat = statsByFileName[name] as FileStat
        return {
          name,
          binary: {
            modifiedOn: stat.modifiedOn,
            size: stat.size,
          },
        }
      }),
    )
    if (isLeft(additionResult)) {
      return done(null, {
        duration: getDurationFrom(start),
        result: additionResult,
      })
    }

    result.updatedMediaFiles = additionResult.right
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

type Dependencies = {
  fs: FilesystemPort
  db: DatabasePort
}