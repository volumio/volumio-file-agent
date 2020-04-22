import {
  DatabasePort,
  MountPointID,
  MountPointWithStats,
} from '@ports/Database'
import { FilesystemPort } from '@ports/Filesystem'
import { MediaFileMetadataProcessingPort } from '@ports/MediaFileMetadataProcessing'
import { Either, isLeft, right } from 'fp-ts/lib/Either'

import { MediaFileProcessingQueue } from './queues/MediaFileProcessing'
import { MountPointFolderProcessingQueue } from './queues/MountPointFolderProcessing'
import { MountPointProcessingQueue } from './queues/MountPointProcessing'
import { MountPointScanningQueue } from './queues/MountPointScanning'
import {
  mountPointEcosystemValidation,
  MountPointEcosystemValidationError,
} from './utils/mountPointEcosystemValidation'
import {
  mountPointStringValidation,
  MountPointStringValidationError,
} from './utils/mountPointStringValidation'

export const Agent = ({
  db,
  fs,
  mediaFileMetadataProcessing,
}: Config): Agent => {
  const mountPointScanningQueue = MountPointScanningQueue({
    fs,
  })
  const mediaFileProcessingQueue = MediaFileProcessingQueue({
    db,
    processMediaFile: mediaFileMetadataProcessing.processMediaFile,
  })
  const mountPointFolderProcessingQueue = MountPointFolderProcessingQueue({
    db,
    enqueueMediaFileProcessing: mediaFileProcessingQueue.add,
    fs,
  })
  const mountPointProcessingQueue = MountPointProcessingQueue({
    processFolder: mountPointFolderProcessingQueue.add,
    scanMountPoint: mountPointScanningQueue.add,
  })

  return {
    addMountPoint: async (str) => {
      const validation = await mountPointStringValidation(str, fs.isDirectory)
      if (isLeft(validation)) {
        return validation
      }

      const { right: mountPoint } = validation

      const databaseMountPointsResult = await db.getAllMountPoints()
      if (isLeft(databaseMountPointsResult)) {
        return databaseMountPointsResult
      }

      const { right: databaseMountPoints } = databaseMountPointsResult
      const enqueuedMountPoints = mountPointProcessingQueue.getEnqueuedMountPoints()
      const knownMountPoints = databaseMountPoints.concat(enqueuedMountPoints)

      const ecosystemValidationResult = mountPointEcosystemValidation(
        mountPoint,
        knownMountPoints,
      )
      if (isLeft(ecosystemValidationResult)) {
        return ecosystemValidationResult
      }

      mountPointProcessingQueue.add(mountPoint)

      return right(undefined)
    },

    discardMountPoint: async (mountPointID) => {
      // TODO: implement flow of a discarded mountPoint's informations
      await db.deleteMountPoint(mountPointID)
    },

    getAllMountPointsWithStats: async () => {
      return db.getAllMountPointsWithStats()
    },
  }
}

export type Agent = {
  addMountPoint: (
    mountPointID: MountPointID,
  ) => Promise<
    Either<
      | MountPointStringValidationError
      | 'PERSISTENCY_FAILURE'
      | MountPointEcosystemValidationError,
      void
    >
  >

  discardMountPoint: (mountPointID: MountPointID) => void

  getAllMountPointsWithStats: () => Promise<
    Either<'PERSISTENCY_FAILURE', MountPointWithStats[]>
  >
}

type Config = {
  db: DatabasePort
  fs: FilesystemPort
  mediaFileMetadataProcessing: MediaFileMetadataProcessingPort
}
