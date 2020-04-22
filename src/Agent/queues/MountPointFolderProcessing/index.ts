import { DatabasePort } from '@ports/Database'
import { FilesystemPort } from '@ports/Filesystem'
import { queue } from 'async'

import {
  Execution,
  ExecutionReport,
  MountPointFolderToProcess,
} from './Execution'

export const MountPointFolderProcessingQueue = ({
  db,
  fs,
}: Dependencies): MountPointFolderProcessingQueue => {
  const internalQueue = queue(Execution({ db, fs }), 3)

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

type Dependencies = {
  db: DatabasePort
  fs: FilesystemPort
}
