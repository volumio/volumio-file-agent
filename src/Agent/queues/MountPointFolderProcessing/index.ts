import { queue } from 'async'

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
      return new Promise((resolve) => {
        internalQueue.push<ExecutionReport>(mountPointFolder, (_, report) =>
          resolve(report),
        )
      })
    },
  }
}

export type MountPointFolderProcessingQueue = {
  add: (mountPointFolder: MountPointFolderToProcess) => Promise<ExecutionReport>
}
