import {
  ArgumentsType,
  MediaFile,
  MediaFileBinaryProcessingStatus,
  MountPointStats,
  MountPointWithStats,
  PersistencyPort,
  PromiseType,
} from '@Agent/ports/Persistency'
import { Database } from 'better-sqlite3'
import { left, right } from 'fp-ts/lib/Either'
import { sortBy, uniq } from 'lodash'

import {
  makeStatements,
  MediaFileRecord,
  mediaFileRecordToPortMediaFile,
} from './statements'

export const SyncAdapter = (db: Database): SyncAdapter => {
  const statements = makeStatements(db)

  const addPendingMediaFiles = db.transaction(
    (input: {
      mountPoint: string
      folder: string
      files: Array<{
        name: string
        size: number
        modifiedOn: Date
      }>
    }): MediaFile[] => {
      input.files.forEach((file) => {
        const fileDoesNotExist =
          statements.getMediaFile.get({
            mountPoint: input.mountPoint,
            folder: input.folder,
            name: file.name,
          }) === undefined

        if (fileDoesNotExist) {
          statements.addMediaFile.run({
            mountPoint: input.mountPoint,
            folder: input.folder,
            name: file.name,
            size: file.size,
            modifiedOn: file.modifiedOn.toISOString(),
          })
        } else {
          statements.setMediaFileProcessingStatusToPending.run({
            mountPoint: input.mountPoint,
            folder: input.folder,
            name: file.name,
            size: file.size,
            modifiedOn: file.modifiedOn.toISOString(),
          })
        }
      })

      return sortBy(input.files, ({ name }) => name)
        .map(
          (file) =>
            statements.getMediaFile.get({
              mountPoint: input.mountPoint,
              folder: input.folder,
              name: file.name,
            }) as MediaFileRecord,
        )
        .map(mediaFileRecordToPortMediaFile)
    },
  )

  const deleteMediaFiles = db.transaction(
    (
      mediaFiles: Array<{
        mountPoint: string
        folder: string
        name: string
      }>,
    ) => {
      mediaFiles.forEach((mediaFile) => {
        statements.deleteMediaFile.run(mediaFile)
      })
    },
  )

  const deleteMountPoint = db.transaction((mountPoint: string) => {
    statements.deleteAllMediaFilesByMountPoint.run({ mountPoint })
  })

  const getAllMediaFilesInFolder = db.transaction(
    (folder: string): MediaFile[] => {
      const records = statements.getAllMediaFilesInFolder.all({
        folder,
      }) as MediaFileRecord[]

      return records.map(mediaFileRecordToPortMediaFile)
    },
  )

  const getAllMountPointsWithStats = db.transaction(
    (): MountPointWithStats[] => {
      const result = statements.getAllMountPoints.all() as Array<{
        mountPoint: string
      }>

      return result
        .map(({ mountPoint }) => mountPoint)
        .sort()
        .map((mountPoint) => {
          const stats = getMountPointStats(mountPoint)
          return {
            path: mountPoint,
            ...stats,
          }
        })
    },
  )

  const getMountPointStats = db.transaction(
    (mountPoint: string): MountPointStats => {
      const getAllMountPointsResults = statements.getAllMountPoints.all() as Array<{
        mountPoint: string
      }>
      if (
        getAllMountPointsResults.find(
          (result) => result.mountPoint === mountPoint,
        ) === undefined
      ) {
        throw new Error('MOUNT_POINT_NOT_FOUND')
      }

      const stats = statements.getMountPointProcessingStats.all({
        mountPoint,
      }) as Array<{
        processingStatus: MediaFileBinaryProcessingStatus
        total: number
      }>

      const artists = uniq(
        (statements.getAllArtistsByMountPoint.all({
          mountPoint,
        }) as Array<{
          artists: string
        }>).reduce<string[]>(
          (allArtists, { artists }) => allArtists.concat(JSON.parse(artists)),
          [],
        ),
      ).sort()

      const albumArtists = uniq(
        (statements.getAllAlbumArtistsByMountPoint.all({
          mountPoint,
        }) as Array<{
          albumArtist: string
        }>).map(({ albumArtist }) => albumArtist),
      )

      const allArtists = uniq(artists.concat(albumArtists))

      const allAlbums = (statements.getAllAlbumsInMountPoint.all({
        mountPoint,
      }) as Array<{
        album: string
      }>).map(({ album }) => album)

      const totalDuration = (statements.getTotalMusicDurationByMountPoint.get({
        mountPoint,
      }) as { totalDuration: number }).totalDuration

      return {
        mediaFiles: {
          total: stats.reduce<number>((n, { total }) => n + total, 0),
          errored:
            stats.find(
              ({ processingStatus }) =>
                processingStatus === MediaFileBinaryProcessingStatus.ERROR,
            )?.total || 0,
          pending:
            stats.find(
              ({ processingStatus }) =>
                processingStatus === MediaFileBinaryProcessingStatus.PENDING,
            )?.total || 0,
          processed:
            stats.find(
              ({ processingStatus }) =>
                processingStatus === MediaFileBinaryProcessingStatus.DONE,
            )?.total || 0,
        },
        music: {
          totalAlbums: allAlbums.length,
          totalArtists: allArtists.length,
          totalDuration: totalDuration,
        },
      }
    },
  )

  const setMediaFileFavoriteState = db.transaction(
    (
      mediaFile: { mountPoint: string; folder: string; name: string },
      state: boolean,
    ): MediaFile => {
      const currentMediaFile = statements.getMediaFile.get(mediaFile) as
        | MediaFileRecord
        | undefined

      if (currentMediaFile === undefined) {
        throw new Error('MEDIA_FILE_NOT_FOUND')
      }

      statements.updateMediaFileFavoriteState.run({
        ...mediaFile,
        favorite: state ? 1 : 0,
      })

      const updatedMediaFile = statements.getMediaFile.get(
        mediaFile,
      ) as MediaFileRecord

      return mediaFileRecordToPortMediaFile(updatedMediaFile)
    },
  )

  const setMediaFileProcessingStatusToError = db.transaction(
    (mediaFile: {
      mountPoint: string
      folder: string
      name: string
    }): MediaFile => {
      const currentMediaFile = statements.getMediaFile.get(mediaFile) as
        | MediaFileRecord
        | undefined

      if (currentMediaFile === undefined) {
        throw new Error('MEDIA_FILE_NOT_FOUND')
      }

      statements.setMediaFileProcessingStatusToError.run(mediaFile)

      const updatedMediaFile = statements.getMediaFile.get(
        mediaFile,
      ) as MediaFileRecord

      return mediaFileRecordToPortMediaFile(updatedMediaFile)
    },
  )

  const updateMediaFileMetadata = db.transaction(
    (
      mediaFile: {
        mountPoint: string
        folder: string
        name: string
      },
      metadata: {
        title: string | null
        artists: string
        albumArtist: string | null
        composers: string
        album: string | null
        genres: string
        trackNumber: number | null
        diskNumber: number | null
        year: number | null

        musicbrainzTrackID: string | null
        musicbrainzRecordingID: string | null
        musicbrainzAlbumID: string | null
        musicbrainzArtistIDs: string
        musicbrainzAlbumArtistIDs: string

        duration: number | null
        bitdepth: number | null
        bitrate: number | null
        sampleRate: number | null
        trackOffset: number

        hasEmbeddedAlbumart: 0 | 1
      },
    ): MediaFile => {
      const currentMediaFile = statements.getMediaFile.get(mediaFile) as
        | MediaFileRecord
        | undefined

      if (currentMediaFile === undefined) {
        throw new Error('MEDIA_FILE_NOT_FOUND')
      }

      statements.updateMediaFileMetadata.run({
        ...mediaFile,
        ...metadata,
      })

      const updatedMediaFile = statements.getMediaFile.get(
        mediaFile,
      ) as MediaFileRecord

      return mediaFileRecordToPortMediaFile(updatedMediaFile)
    },
  )

  return {
    addPendingMediaFiles: (input) => {
      try {
        return right(addPendingMediaFiles(input))
      } catch (error) {
        return left('PERSISTENCY_FAILURE')
      }
    },
    deleteMediaFiles: (mediaFiles) => {
      try {
        return right(deleteMediaFiles(mediaFiles))
      } catch (error) {
        return left('PERSISTENCY_FAILURE')
      }
    },
    deleteMountPoint: (mountPoint) => {
      try {
        return right(deleteMountPoint(mountPoint))
      } catch (error) {
        return left('PERSISTENCY_FAILURE')
      }
    },
    getAllAlbumArtists: () => {
      try {
        const records = statements.getAllAlbumArtists.all() as Array<{
          albumArtist: string
        }>

        const albumArtists = uniq(records.map(({ albumArtist }) => albumArtist))

        return right(albumArtists.sort())
      } catch (error) {
        return left('PERSISTENCY_FAILURE')
      }
    },
    getAllArtists: () => {
      try {
        const records = statements.getAllArtists.all() as Array<{
          artists: string
        }>

        const artists = uniq(
          records
            .map<string[]>(({ artists }) => JSON.parse(artists))
            .reduce<string[]>(
              (allArtists, artists) => allArtists.concat(artists),
              [],
            ),
        )

        return right(artists.sort())
      } catch (error) {
        return left('PERSISTENCY_FAILURE')
      }
    },
    getAllComposers: () => {
      try {
        const records = statements.getAllComposers.all() as Array<{
          composers: string
        }>

        const composers = uniq(
          records
            .map<string[]>(({ composers }) => JSON.parse(composers))
            .reduce<string[]>(
              (allComposers, composers) => allComposers.concat(composers),
              [],
            ),
        )

        return right(composers.sort())
      } catch (error) {
        return left('PERSISTENCY_FAILURE')
      }
    },
    getAllGenres: () => {
      try {
        const records = statements.getAllGenres.all() as Array<{
          genres: string
        }>

        const genres = uniq(
          records
            .map<string[]>(({ genres }) => JSON.parse(genres))
            .reduce<string[]>(
              (allGenres, genres) => allGenres.concat(genres),
              [],
            ),
        )

        return right(genres.sort())
      } catch (error) {
        return left('PERSISTENCY_FAILURE')
      }
    },
    getAllMediaFilesByAlbum: ({ artist, title }) => {
      try {
        const records = statements.getAllMediaFilesByAlbum.all({
          album: title,
        }) as MediaFileRecord[]

        const mediaFiles = records.map(mediaFileRecordToPortMediaFile)

        const mediaFilesWithMatchingArtist = mediaFiles.filter(
          (mediaFile) =>
            mediaFile.albumArtist === artist ||
            mediaFile.artists.includes(artist),
        )
        return right(mediaFilesWithMatchingArtist)
      } catch (error) {
        return left('PERSISTENCY_FAILURE')
      }
    },
    getAllMediaFilesInFolder: (folder) => {
      try {
        return right(getAllMediaFilesInFolder(folder))
      } catch (error) {
        return left('PERSISTENCY_FAILURE')
      }
    },
    getAllMountPoints: () => {
      try {
        const result = statements.getAllMountPoints.all() as Array<{
          mountPoint: string
        }>
        return right(result.map(({ mountPoint }) => mountPoint).sort())
      } catch (error) {
        return left('PERSISTENCY_FAILURE')
      }
    },
    getAllMountPointsWithStats: () => {
      try {
        return right(getAllMountPointsWithStats())
      } catch (error) {
        return left('PERSISTENCY_FAILURE')
      }
    },
    getAllYears: () => {
      try {
        const records = statements.getAllYears.all() as Array<{
          year: number
        }>

        const years = uniq(records.map<number>(({ year }) => year))

        return right(years.sort())
      } catch (error) {
        return left('PERSISTENCY_FAILURE')
      }
    },
    getMountPointStats: (mountPoint) => {
      try {
        return right(getMountPointStats(mountPoint))
      } catch (error) {
        if (error.message === 'MOUNT_POINT_NOT_FOUND') {
          return left('MOUNT_POINT_NOT_FOUND')
        }
        return left('PERSISTENCY_FAILURE')
      }
    },
    setMediaFileFavoriteState: (mediaFile, state) => {
      try {
        return right(setMediaFileFavoriteState(mediaFile, state))
      } catch (error) {
        if (error.message === 'MEDIA_FILE_NOT_FOUND') {
          return left('MEDIA_FILE_NOT_FOUND')
        }
        return left('PERSISTENCY_FAILURE')
      }
    },
    setMediaFileProcessingStatusToError: (mediaFile) => {
      try {
        return right(setMediaFileProcessingStatusToError(mediaFile))
      } catch (error) {
        if (error.message === 'MEDIA_FILE_NOT_FOUND') {
          return left('MEDIA_FILE_NOT_FOUND')
        }
        return left('PERSISTENCY_FAILURE')
      }
    },
    updateMediaFileMetadata: (mediaFile, metadata) => {
      try {
        return right(
          updateMediaFileMetadata(mediaFile, {
            ...metadata,
            artists: JSON.stringify(metadata.artists.sort()),
            composers: JSON.stringify(metadata.composers.sort()),
            genres: JSON.stringify(metadata.genres.sort()),
            musicbrainzArtistIDs: JSON.stringify(
              metadata.musicbrainzArtistIDs.sort(),
            ),
            musicbrainzAlbumArtistIDs: JSON.stringify(
              metadata.musicbrainzAlbumArtistIDs.sort(),
            ),
            hasEmbeddedAlbumart: metadata.hasEmbeddedAlbumart ? 1 : 0,
          }),
        )
      } catch (error) {
        if (error.message === 'MEDIA_FILE_NOT_FOUND') {
          return left('MEDIA_FILE_NOT_FOUND')
        }
        return left('PERSISTENCY_FAILURE')
      }
    },
  }
}

type SyncAdapter = {
  [k in keyof PersistencyPort]: (
    ...args: ArgumentsType<PersistencyPort[k]>
  ) => PromiseType<ReturnType<PersistencyPort[k]>>
}
