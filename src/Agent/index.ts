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
      allTracksByComposer: async (composer) => {
        const getAllMediaFilesByComposerResult = await persistency.getAllMediaFilesByComposer(
          composer.name,
        )

        if (isLeft(getAllMediaFilesByComposerResult)) {
          return left('PERSISTENCY_FAILURE')
        }

        const mediaFiles = getAllMediaFilesByComposerResult.right

        return right(mediaFiles.map(fromPersistencyMediaFileToTrack))
      },
      allTracksByGenre: async (genre) => {
        const getAllMediaFilesByGenreResult = await persistency.getAllMediaFilesByGenre(
          genre.name,
        )

        if (isLeft(getAllMediaFilesByGenreResult)) {
          return left('PERSISTENCY_FAILURE')
        }

        const mediaFiles = getAllMediaFilesByGenreResult.right

        return right(mediaFiles.map(fromPersistencyMediaFileToTrack))
      },
      allTracksByYear: async (year) => {
        const getAllMediaFilesByYearResult = await persistency.getAllMediaFilesByYear(
          year,
        )
        if (isLeft(getAllMediaFilesByYearResult)) {
          return left('PERSISTENCY_FAILURE')
        }

        const mediaFiles = getAllMediaFilesByYearResult.right

        return right(mediaFiles.map(fromPersistencyMediaFileToTrack))
      },
      allTracksInFolder: async (folderPath) => {
        const getAllMediaFilesInFolderResult = await persistency.getAllMediaFilesInFolder(
          folderPath,
        )

        if (isLeft(getAllMediaFilesInFolderResult)) {
          return left('PERSISTENCY_FAILURE')
        }

        const mediaFiles = getAllMediaFilesInFolderResult.right

        return right(mediaFiles.map(fromPersistencyMediaFileToTrack))
      },
      allTracksHavingAlbum: async () => {
        const getAllMediaFilesHavingAlbumResult = await persistency.getAllMediaFilesHavingAlbum()

        if (isLeft(getAllMediaFilesHavingAlbumResult)) {
          return left('PERSISTENCY_FAILURE')
        }

        const mediaFiles = getAllMediaFilesHavingAlbumResult.right

        return right(mediaFiles.map(fromPersistencyMediaFileToTrack))
      },
      allMountPoints: async () => {
        const getAllMountPointsWithStatsResult = await persistency.getAllMountPointsWithStats()

        if (isLeft(getAllMountPointsWithStatsResult)) {
          return left('PERSISTENCY_FAILURE')
        }

        const mountPoints = getAllMountPointsWithStatsResult.right

        const enqueuedMountPoints = mountPointProcessingQueue.getEnqueuedMountPoints()

        return right(
          mountPoints.map((mountPoint) => ({
            ...mountPoint,
            processing: enqueuedMountPoints.includes(mountPoint.path),
          })),
        )
      },
      allYears: async () => {
        const allYearsResult = await persistency.getAllYears()

        if (isLeft(allYearsResult)) {
          return left('PERSISTENCY_FAILURE')
        }

        return right(allYearsResult.right.sort())
      },
      folderSubfolders: async (folderPath) =>
        fs.findDirectorySubDirectories(folderPath),
    },
  }
}

type Config = {
  fs: FilesystemPort
  mediaFileMetadataProcessing: MediaFileMetadataProcessingPort
  persistency: PersistencyPort
}
