import { isLeft, left, right } from 'fp-ts/lib/Either'
import { uniq } from 'lodash'

import { FilesystemPort } from './ports/Filesystem'
import { MediaFileMetadataProcessingPort } from './ports/MediaFileMetadataProcessing'
import { PersistencyPort } from './ports/Persistency'
import { MediaFileProcessingQueue } from './queues/MediaFileProcessing'
import { MountPointFolderProcessingQueue } from './queues/MountPointFolderProcessing'
import { MountPointProcessingQueue } from './queues/MountPointProcessing'
import { MountPointScanningQueue } from './queues/MountPointScanning'
import { AgentInterface } from './types'
import { fromPersistencyMediaFileToTrack } from './utils/fromPersistencyMediaFileToTrack'
import { mountPointEcosystemValidation } from './utils/mountPointEcosystemValidation'
import { mountPointFSValidation } from './utils/mountPointFSValidation'
import { mountPointPathValidation } from './utils/mountPointPathValidation'

export { AgentInterface, Track } from './types'

export const Agent = ({
  fs,
  mediaFileMetadataProcessing,
  persistency,
}: Config): AgentInterface => {
  const mountPointScanningQueue = MountPointScanningQueue({
    fs,
  })
  const mediaFileProcessingQueue = MediaFileProcessingQueue({
    persistency,
    processMediaFile: mediaFileMetadataProcessing.processMediaFile,
  })
  const mountPointFolderProcessingQueue = MountPointFolderProcessingQueue({
    enqueueMediaFileProcessing: mediaFileProcessingQueue.add,
    fs,
    persistency,
  })
  const mountPointProcessingQueue = MountPointProcessingQueue({
    processFolder: mountPointFolderProcessingQueue.add,
    scanMountPoint: mountPointScanningQueue.add,
  })

  return {
    command: {
      addMountPoint: async (mountPointPath) => {
        const trimmedPath = mountPointPath.trim()
        const pathWithoutTrailingSlash = trimmedPath.endsWith('/')
          ? trimmedPath.slice(0, -1)
          : trimmedPath

        const pathValidation = mountPointPathValidation(
          pathWithoutTrailingSlash,
        )
        if (isLeft(pathValidation)) {
          return pathValidation
        }

        const fsValidation = await mountPointFSValidation(
          pathWithoutTrailingSlash,
          fs.isDirectory,
        )
        if (isLeft(fsValidation)) {
          return fsValidation
        }

        const databaseMountPointsResult = await persistency.getAllMountPoints()
        if (isLeft(databaseMountPointsResult)) {
          return databaseMountPointsResult
        }

        const databaseMountPoints = databaseMountPointsResult.right
        const enqueuedMountPoints = mountPointProcessingQueue.getEnqueuedMountPoints()
        const knownMountPoints = databaseMountPoints.concat(enqueuedMountPoints)

        const ecosystemValidationResult = mountPointEcosystemValidation(
          pathWithoutTrailingSlash,
          knownMountPoints,
        )
        if (isLeft(ecosystemValidationResult)) {
          return ecosystemValidationResult
        }

        mountPointProcessingQueue.add(pathWithoutTrailingSlash)

        return right(undefined)
      },
      removeMountPoint: async (mountPointPath) => {
        // TODO: implement flow of a discarded mountPoint's informations
        return persistency.deleteMountPoint(mountPointPath)
      },
    },
    query: {
      allArtistsNames: async () => {
        const [albumArtistsResult, artistsResult] = await Promise.all([
          persistency.getAllAlbumArtists(),
          persistency.getAllArtists(),
        ])

        if (isLeft(albumArtistsResult) || isLeft(artistsResult)) {
          return left('PERSISTENCY_FAILURE')
        }

        const names = uniq(
          albumArtistsResult.right.concat(artistsResult.right),
        ).sort()

        return right(names)
      },
      allComposersNames: async () => {
        const getAllComposersResult = await persistency.getAllComposers()

        if (isLeft(getAllComposersResult)) {
          return left('PERSISTENCY_FAILURE')
        }

        return right(getAllComposersResult.right.sort())
      },
      allGenresNames: async () => {
        const getAllGenresResult = await persistency.getAllGenres()

        if (isLeft(getAllGenresResult)) {
          return left('PERSISTENCY_FAILURE')
        }

        return right(getAllGenresResult.right.sort())
      },
      allTracksByAlbum: async (input) => {
        const getAllMediaFilesByAlbumResult = await persistency.getAllMediaFilesByAlbum(
          input,
        )
        if (isLeft(getAllMediaFilesByAlbumResult)) {
          return left('PERSISTENCY_FAILURE')
        }

        const mediaFiles = getAllMediaFilesByAlbumResult.right

        return right(mediaFiles.map(fromPersistencyMediaFileToTrack))
      },
      allTracksByArtist: async (artist) => {
        const getAllMediaFilesByArtistResult = await persistency.getAllMediaFilesByArtist(
          artist.name,
        )

        if (isLeft(getAllMediaFilesByArtistResult)) {
          return left('PERSISTENCY_FAILURE')
        }

        const mediaFiles = getAllMediaFilesByArtistResult.right

        return right(mediaFiles.map(fromPersistencyMediaFileToTrack))
      },
      allTracksByComposer: async (_) => {
        return right([])
      },
      allTracksByGenre: async (_) => {
        return right([])
      },
      allTracksByYear: async (_) => {
        return right([])
      },
      allTracksInFolder: async (_) => {
        return right([])
      },
      allMountPoints: async () => {
        return right([])
      },
      allYears: async () => {
        const allYearsResult = await persistency.getAllYears()

        if (isLeft(allYearsResult)) {
          return left('PERSISTENCY_FAILURE')
        }

        return right(allYearsResult.right.sort())
      },
      folderSubfolders: async () => {
        return right([])
      },
    },
  }
}

type Config = {
  fs: FilesystemPort
  mediaFileMetadataProcessing: MediaFileMetadataProcessingPort
  persistency: PersistencyPort
}
