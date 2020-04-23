import { TupleFromUnion } from '@adapters/Database/SQLite/TupleFromUnion'
import {
  ArgumentsType,
  DatabasePort,
  FolderID,
  MediaFile,
  MediaFileBinaryInfos,
  MediaFileBinaryProcessingStatus,
  MediaFileID,
  MediaFileMetadata,
  MediaFileToAddToFolder,
  MountPointID,
  MountPointStats,
  MountPointWithStats,
  PromiseType,
} from '@ports/Database'
import { Database } from 'better-sqlite3'
import { left, right } from 'fp-ts/lib/Either'
import { sortBy } from 'lodash'
import path from 'path'
import { Overwrite } from 'simplytyped'

const MEDIAFILE_ID_PROPS: TupleFromUnion<keyof MediaFileID> = [
  'mountPoint',
  'folder',
  'name',
]

const MEDIAFILE_BINARY_INFO_PROPS: TupleFromUnion<
  keyof MediaFileBinaryInfos
> = ['size', 'modifiedOn']

const MEDIAFILE_METADATA_PROPS: TupleFromUnion<keyof MediaFileMetadata> = [
  'title',
  'duration',
  'sampleRate',
  'artist',
  'albumArtist',
  'composer',
  'album',
  'trackNumber',
  'diskNumber',
  'year',
]

const MEDIAFILE_PROPS = [
  ...MEDIAFILE_ID_PROPS,
  ...MEDIAFILE_BINARY_INFO_PROPS,
  ...MEDIAFILE_METADATA_PROPS,
  'processingStatus',
  'favorite',
]

export const SyncAdapter: (db: Database) => SyncAdapter = (db) => {
  const statements = {
    addMediaFile: db.prepare<
      [MediaFileIDColumns & MediaFileBinaryInfosColumns]
    >(`
      INSERT INTO mediaFiles
        (mountPoint, folder, name, processingStatus, size, modifiedOn)
      VALUES
        (@mountPoint, @folder, @name, 'PENDING', @size, @modifiedOn)
    `),
    deleteMediaFile: db.prepare<[MediaFileIDColumns]>(`
      DELETE
      FROM mediaFiles
      WHERE
        mountPoint = @mountPoint AND
        folder = @folder AND
        name = @name
    `),
    deleteMountPoint: db.prepare<[MountPointID]>(`
      DELETE
      FROM mediaFiles
      WHERE
        mountPoint = ?
    `),
    getMountPointTotalMusicDuration: db.prepare<[MountPointID]>(`
      SELECT
        SUM(duration) as totalDuration
      FROM mediaFiles
      WHERE
        duration IS NOT NULL AND
        mountPoint = ?
    `),
    selectAllAlbumsInMountPoint: db.prepare<[MountPointID]>(`
      SELECT
        DISTINCT album
      FROM mediaFiles
      WHERE
        album IS NOT NULL AND
        mountPoint = ?
    `),
    selectAllArtistsInMountPoint: db.prepare<[MountPointID]>(`
      SELECT
        DISTINCT artist
      FROM mediaFiles
      WHERE
        artist IS NOT NULL AND
        mountPoint = ?
    `),
    selectAllMediaFilesInFolder: db.prepare<[FolderID]>(`
      SELECT
        ${MEDIAFILE_PROPS.join(',')}
      FROM mediaFiles
      WHERE
        mountPoint = @mountPoint AND
        folder = @folder
    `),
    selectAllMountPoints: db.prepare(`
      SELECT
        DISTINCT mountPoint
      FROM mediaFiles
    `),
    selectMediaFile: db.prepare<[MediaFileIDColumns]>(`
      SELECT
        ${MEDIAFILE_PROPS.join(',')}
      FROM mediaFiles
      WHERE
        mountPoint = @mountPoint AND
        folder = @folder AND
        name = @name
    `),
    selectMountPointProcessingStats: db.prepare<[MountPointID]>(`
      SELECT
        processingStatus,
        COUNT(*) as total
      FROM mediaFiles
      WHERE
        mountPoint = ?
    `),
    setMediaFileProcessingStatusToError: db.prepare<[MediaFileIDColumns]>(`
      UPDATE mediaFiles
      SET
        processingStatus = 'ERROR'
      WHERE
        mountPoint = @mountPoint AND
        folder = @folder AND
        name = @name
    `),
    setMediaFileProcessingStatusToPending: db.prepare<
      [MediaFileIDColumns & MediaFileBinaryInfosColumns]
    >(`
      UPDATE mediaFiles
      SET
        processingStatus = 'PENDING',
        size = @size,
        modifiedOn = @modifiedOn
      WHERE
        mountPoint = @mountPoint AND
        folder = @folder AND
        name = @name
    `),
    updateMediaFileFavoriteState: db.prepare<
      [MediaFileIDColumns & { favorite: 0 | 1 }]
    >(`
      UPDATE mediaFiles
      SET
        favorite = @favorite
      WHERE
        mountPoint = @mountPoint AND
        folder = @folder AND
        name = @name
    `),
    updateMediaFileMetadata: db.prepare<
      [MediaFileIDColumns & MediaFileMetadataColumns]
    >(`
      UPDATE mediaFiles
      SET
        processingStatus = 'DONE',
        
        title = @title,
        duration = @duration,
        sampleRate = @sampleRate,
        artist = @artist,
        albumArtist = @albumArtist,
        composer = @composer,
        album = @album,
        trackNumber = @trackNumber,
        diskNumber = @diskNumber,
        year = @year
      WHERE
        mountPoint = @mountPoint AND
        folder = @folder AND
        name = @name
    `),
  }

  const transaction = {
    addPendingMediaFilesToFolder: db.transaction(
      (folder: FolderID, files: MediaFileToAddToFolder[]): MediaFile[] => {
        files.forEach((file) => {
          const stmtParams = {
            ...folder,
            name: file.name,
            size: file.binary.size,
            modifiedOn: file.binary.modifiedOn.toISOString(),
          }

          const fileDoesNotExist =
            statements.selectMediaFile.get({
              ...folder,
              name: file.name,
            }) === undefined

          if (fileDoesNotExist) {
            statements.addMediaFile.run(stmtParams)
          } else {
            statements.setMediaFileProcessingStatusToPending.run(stmtParams)
          }
        })

        return sortBy(files, ({ name }) => name)
          .map(
            (file) =>
              statements.selectMediaFile.get({
                ...folder,
                name: file.name,
              }) as MediaFileRecord,
          )
          .map(fromMediaFileRecordToMediaFile)
      },
    ),
    getAllMountPointsWithStats: db.transaction((): MountPointWithStats[] => {
      const allMountPointsResult = statements.selectAllMountPoints.all() as Array<{
        mountPoint: string
      }>

      return allMountPointsResult
        .map(({ mountPoint }) => mountPoint)
        .sort()
        .map((mountPointID) => {
          const stats = transaction.getMountPointStats(mountPointID)
          return {
            path: mountPointID,
            ...stats,
          }
        })
    }),
    getMountPointStats: db.transaction(
      (mountPointID: MountPointID): MountPointStats => {
        const allMountPointsResult = statements.selectAllMountPoints.all() as Array<{
          mountPoint: string
        }>
        if (
          allMountPointsResult.find(
            ({ mountPoint }) => mountPoint === mountPointID,
          ) === undefined
        ) {
          throw new Error('MOUNT_POINT_NOT_FOUND')
        }

        const stats = statements.selectMountPointProcessingStats.all(
          mountPointID,
        ) as Array<{
          processinStatus: MediaFileBinaryProcessingStatus
          total: number
        }>

        const allArtists = (statements.selectAllArtistsInMountPoint.all(
          mountPointID,
        ) as Array<{
          artist: string
        }>).map(({ artist }) => artist)

        const allAlbums = (statements.selectAllAlbumsInMountPoint.all(
          mountPointID,
        ) as Array<{
          album: string
        }>).map(({ album }) => album)

        const totalDuration = (statements.getMountPointTotalMusicDuration.get(
          mountPointID,
        ) as { totalDuration: number }).totalDuration

        return {
          mediaFiles: {
            total: stats.reduce<number>((n, { total }) => n + total, 0),
            errored:
              stats.find(
                ({ processinStatus }) =>
                  processinStatus === MediaFileBinaryProcessingStatus.ERROR,
              )?.total || 0,
            pending:
              stats.find(
                ({ processinStatus }) =>
                  processinStatus === MediaFileBinaryProcessingStatus.PENDING,
              )?.total || 0,
            processed:
              stats.find(
                ({ processinStatus }) =>
                  processinStatus === MediaFileBinaryProcessingStatus.DONE,
              )?.total || 0,
          },
          music: {
            totalAlbums: allAlbums.length,
            totalArtists: allArtists.length,
            totalDuration: totalDuration,
          },
        }
      },
    ),
    deleteMediaFiles: db.transaction((mediaFileIDs: MediaFileID[]) => {
      mediaFileIDs.forEach((mediaFileID) => {
        statements.deleteMediaFile.run(mediaFileID)
      })
    }),
    deleteMountPoint: db.transaction((mountPointID: MountPointID) => {
      statements.deleteMountPoint.run(mountPointID)
    }),
    setMediaFileFavoriteState: db.transaction(
      (mediaFileID: MediaFileID, state: boolean): MediaFile => {
        const currentMediaFile = statements.selectMediaFile.get(mediaFileID) as
          | MediaFileRecord
          | undefined

        if (currentMediaFile === undefined) {
          throw new Error('MEDIA_FILE_NOT_FOUND')
        }

        statements.updateMediaFileFavoriteState.run({
          ...mediaFileID,
          favorite: state ? 1 : 0,
        })

        const updatedMediaFile = statements.selectMediaFile.get(
          mediaFileID,
        ) as MediaFileRecord

        return fromMediaFileRecordToMediaFile(updatedMediaFile)
      },
    ),
    setMediaFileProcessingStatusToError: db.transaction(
      (mediaFileID: MediaFileID): MediaFile => {
        const currentMediaFile = statements.selectMediaFile.get(mediaFileID) as
          | MediaFileRecord
          | undefined

        if (currentMediaFile === undefined) {
          throw new Error('MEDIA_FILE_NOT_FOUND')
        }

        statements.setMediaFileProcessingStatusToError.run(mediaFileID)

        const updatedMediaFile = statements.selectMediaFile.get(
          mediaFileID,
        ) as MediaFileRecord

        return fromMediaFileRecordToMediaFile(updatedMediaFile)
      },
    ),
    updateMediaFileMetadata: db.transaction(
      (mediaFileID: MediaFileID, metadata: MediaFileMetadata): MediaFile => {
        const currentMediaFile = statements.selectMediaFile.get(mediaFileID) as
          | MediaFileRecord
          | undefined

        if (currentMediaFile === undefined) {
          throw new Error('MEDIA_FILE_NOT_FOUND')
        }

        statements.updateMediaFileMetadata.run({
          ...mediaFileID,
          ...metadata,
        })

        const updatedMediaFile = statements.selectMediaFile.get(
          mediaFileID,
        ) as MediaFileRecord

        return fromMediaFileRecordToMediaFile(updatedMediaFile)
      },
    ),
  }

  const addPendingMediaFilesToFolder: SyncAdapter['addPendingMediaFilesToFolder'] = (
    folder,
    files,
  ) => {
    try {
      return right(transaction.addPendingMediaFilesToFolder(folder, files))
    } catch (error) {
      return left('PERSISTENCY_FAILURE')
    }
  }

  const deleteMediaFiles: SyncAdapter['deleteMediaFiles'] = (mediaFileIDs) => {
    try {
      return right(transaction.deleteMediaFiles(mediaFileIDs))
    } catch (error) {
      return left('PERSISTENCY_FAILURE')
    }
  }

  const deleteMountPoint: SyncAdapter['deleteMountPoint'] = (mountPointID) => {
    try {
      return right(transaction.deleteMountPoint(mountPointID))
    } catch (error) {
      return left('PERSISTENCY_FAILURE')
    }
  }

  const getAllMountPoints: SyncAdapter['getAllMountPoints'] = () => {
    try {
      const result: Array<{
        mountPoint: string
      }> = statements.selectAllMountPoints.all()
      return right(result.map(({ mountPoint }) => mountPoint))
    } catch (error) {
      return left('PERSISTENCY_FAILURE')
    }
  }

  const getAllMountPointsWithStats: SyncAdapter['getAllMountPointsWithStats'] = () => {
    try {
      return right(transaction.getAllMountPointsWithStats())
    } catch (error) {
      return left('PERSISTENCY_FAILURE')
    }
  }

  const getMediaFilesInFolder: SyncAdapter['getMediaFilesInFolder'] = (
    folderID,
  ) => {
    try {
      const result = statements.selectAllMediaFilesInFolder.all(
        folderID,
      ) as MediaFileRecord[]
      return right(result.map(fromMediaFileRecordToMediaFile))
    } catch (error) {
      return left('PERSISTENCY_FAILURE')
    }
  }

  const getMountPointStats: SyncAdapter['getMountPointStats'] = (
    mountPointID,
  ) => {
    try {
      return right(transaction.getMountPointStats(mountPointID))
    } catch (error) {
      if (error.message === 'MOUNT_POINT_NOT_FOUND') {
        return left('MOUNT_POINT_NOT_FOUND')
      }
      return left('PERSISTENCY_FAILURE')
    }
  }

  const setMediaFileFavoriteState: SyncAdapter['setMediaFileFavoriteState'] = (
    mediaFileID,
    state,
  ) => {
    try {
      return right(transaction.setMediaFileFavoriteState(mediaFileID, state))
    } catch (error) {
      if (error.message === 'MEDIA_FILE_NOT_FOUND') {
        return left('MEDIA_FILE_NOT_FOUND')
      }
      return left('PERSISTENCY_FAILURE')
    }
  }

  const setMediaFileProcessingStatusToError: SyncAdapter['setMediaFileProcessingStatusToError'] = (
    mediaFileID,
  ) => {
    try {
      return right(transaction.setMediaFileProcessingStatusToError(mediaFileID))
    } catch (error) {
      if (error.message === 'MEDIA_FILE_NOT_FOUND') {
        return left('MEDIA_FILE_NOT_FOUND')
      }
      return left('PERSISTENCY_FAILURE')
    }
  }

  const updateMediaFileMetadata: SyncAdapter['updateMediaFileMetadata'] = (
    mediaFileID,
    metadata,
  ) => {
    try {
      return right(transaction.updateMediaFileMetadata(mediaFileID, metadata))
    } catch (error) {
      if (error.message === 'MEDIA_FILE_NOT_FOUND') {
        return left('MEDIA_FILE_NOT_FOUND')
      }
      return left('PERSISTENCY_FAILURE')
    }
  }

  return {
    addPendingMediaFilesToFolder,
    deleteMediaFiles,
    deleteMountPoint,
    getAllMountPoints,
    getAllMountPointsWithStats,
    getMediaFilesInFolder,
    getMountPointStats,
    setMediaFileFavoriteState,
    setMediaFileProcessingStatusToError,
    updateMediaFileMetadata,
  }
}

const fromMediaFileRecordToMediaFile = (
  record: MediaFileRecord,
): MediaFile => ({
  id: {
    mountPoint: record.mountPoint,
    folder: record.folder,
    name: record.name,
  },
  path: path.resolve(record.folder, record.name),
  processingStatus: record.processingStatus,
  binary: {
    size: record.size,
    modifiedOn: new Date(record.modifiedOn),
  },
  favorite: Boolean(record.favorite),
  metadata: {
    album: record.artist,
    albumArtist: record.albumArtist,
    artist: record.artist,
    composer: record.composer,
    diskNumber: record.diskNumber,
    duration: record.duration,
    sampleRate: record.sampleRate,
    title: record.title,
    trackNumber: record.trackNumber,
    year: record.year,
  },
})

type SyncAdapter = {
  [k in keyof DatabasePort]: (
    ...args: ArgumentsType<DatabasePort[k]>
  ) => PromiseType<ReturnType<DatabasePort[k]>>
}

type MediaFileRecord = MediaFileIDColumns &
  MediaFileBinaryInfosColumns &
  MediaFileMetadataColumns & {
    processingStatus: MediaFileBinaryProcessingStatus
    favorite: 0 | 1
  }

type MediaFileIDColumns = MediaFileID
type MediaFileBinaryInfosColumns = Overwrite<
  MediaFileBinaryInfos,
  {
    modifiedOn: string
  }
>
type MediaFileMetadataColumns = MediaFileMetadata
