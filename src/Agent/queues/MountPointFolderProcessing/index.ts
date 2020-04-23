import { queue } from 'async'
import { isLeft, isRight } from 'fp-ts/lib/Either'

import { debug } from './debug'
import {
  Dependencies,
  Execution,
  ExecutionReport,
  MountPointFolderToProcess,
} from './Execution'

export const MountPointFolderProcessingQueue = ({
  db,
  enqueueMediaFileProcessing,
  fs,
}: Dependencies): MountPointFolderProcessingQueue => {
  const internalQueue = queue(
    Execution({ db, enqueueMediaFileProcessing, fs }),
    3,
  )

  return {
    add: async (mountPointFolder) => {
      return new Promise<ExecutionReport>((resolve) => {
        internalQueue.push<ExecutionReport>(mountPointFolder, (_, r) => {
          const report = r as ExecutionReport // This is for the compiler, we know r won't be undefined

          resolve(report)

          if (debug.info.enabled && isRight(report.result)) {
            debug.info.enabled &&
              debug.info(
                `Completed processing of folder: %s in %d ms. %d media files were updated, %d media files were removed`,
                mountPointFolder.folder,
                report.duration,
                report.result.right.updatedMediaFiles.length,
                report.result.right.deletedMediaFiles.length,
              )
          } else if (debug.error.enabled && isLeft(report.result)) {
            debug.info.enabled &&
              debug.info(
                `[ERROR: %s] in completed processing of folder: %s`,
                report.result.left,
                mountPointFolder.folder,
              )
          }
        })

        debug.info.enabled &&
          debug.info(
            `Enqueued processing of folder: %s`,
            mountPointFolder.folder,
          )
      })
    },
  }
}

export type MountPointFolderProcessingQueue = {
  add: (mountPointFolder: MountPointFolderToProcess) => Promise<ExecutionReport>
}
