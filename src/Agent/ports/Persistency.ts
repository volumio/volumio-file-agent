import { Either } from 'fp-ts/lib/Either'
import { Observable } from 'rxjs'
import { CombineObjects, UnionizeProperties } from 'simplytyped'

export type PersistencyPort = {
  /**
   * Adds a collection of MediaFiles under a specific folder
   * Those files processing status should be marked as PENDING.
   *
   * If some of the files already exist, they will be marked as PENDING
   * and their "size" and "modifiedOn" infos will be updated.
   */
  addPendingMediaFiles: (input: {
    mountPoint: string
    folder: string
    files: Array<{
      name: string
      size: number
      modifiedOn: Date
    }>
  }) => Promise<Either<'PERSISTENCY_FAILURE', MediaFile[]>>

  /**
   * Ensures a set of MediaFile(s) is no longer present
   */
  deleteMediaFiles: (
    mediaFiles: Array<{
      mountPoint: string
      folder: string
      name: string
    }>,
  ) => Promise<Either<'PERSISTENCY_FAILURE', void>>

  /**
   * Ensures a MountPoint and all of its mediafiles are no longer present
   */
  deleteMountPoint: (
    mountPoint: string,
  ) => Promise<Either<'PERSISTENCY_FAILURE', void>>

  getAllAlbumArtists: () => Promise<Either<'PERSISTENCY_FAILURE', string[]>>

  getAllArtists: () => Promise<Either<'PERSISTENCY_FAILURE', string[]>>

  getAllComposers: () => Promise<Either<'PERSISTENCY_FAILURE', string[]>>

  getAllMediaFilesByAlbum: (input: {
    artist: string
    title: string
  }) => Promise<Either<'PERSISTENCY_FAILURE', MediaFile[]>>

  /**
   * Retrieves the list of MediaFile(s) contained
   * in a given folder
   */
  getAllMediaFilesInFolder: (
    folder: string,
  ) => Promise<Either<'PERSISTENCY_FAILURE', MediaFile[]>>

  /**
   * Retrieves the list of known MountPoint(s)
   */
  getAllMountPoints: () => Promise<Either<'PERSISTENCY_FAILURE', string[]>>

  getAllMountPointsWithStats: () => Promise<
    Either<'PERSISTENCY_FAILURE', MountPointWithStats[]>
  >

  /**
   * Retrieves statistics about a MountPoint
   */
  getMountPointStats: (
    mountPoint: string,
  ) => Promise<
    Either<'PERSISTENCY_FAILURE' | 'MOUNT_POINT_NOT_FOUND', MountPointStats>
  >

  /**
   * Sets the favorite state of a MediaFile
   */
  setMediaFileFavoriteState: (
    mediaFile: {
      mountPoint: string
      folder: string
      name: string
    },
    state: boolean,
  ) => Promise<
    Either<'PERSISTENCY_FAILURE' | 'MEDIA_FILE_NOT_FOUND', MediaFile>
  >

  /**
   * Sets the processing status of a MediaFile to ERROR
   */
  setMediaFileProcessingStatusToError: (mediaFile: {
    mountPoint: string
    folder: string
    name: string
  }) => Promise<
    Either<'PERSISTENCY_FAILURE' | 'MEDIA_FILE_NOT_FOUND', MediaFile>
  >

  /**
   * Updates the metadata of a MediaFIle
   */
  updateMediaFileMetadata: (
    mediaFile: {
      mountPoint: string
      folder: string
      name: string
    },
    metadata: MediaFileMetadata,
  ) => Promise<
    Either<'PERSISTENCY_FAILURE' | 'MEDIA_FILE_NOT_FOUND', MediaFile>
  >
}

export type MountPointWithStats = CombineObjects<
  {
    path: string
  },
  MountPointStats
>

export type MountPointStats = {
  mediaFiles: {
    total: number
    errored: number
    pending: number
    processed: number
  }
  music: {
    totalDuration: number
    totalArtists: number
    totalAlbums: number
  }
}

export type MediaFile = CombineObjects<
  {
    mountPoint: string
    folder: string
    name: string

    size: number
    modifiedOn: Date

    processingStatus: MediaFileBinaryProcessingStatus
    favorite: boolean
  },
  MediaFileMetadata
>

export enum MediaFileBinaryProcessingStatus {
  DONE = 'DONE',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}

export type MediaFileMetadata = {
  title: Maybe<string>
  artists: string[]
  albumArtist: Maybe<string>
  composers: string[]
  album: Maybe<string>
  genres: string[]
  trackNumber: Maybe<number>
  diskNumber: Maybe<number>
  year: Maybe<number>

  musicbrainzTrackID: Maybe<string>
  musicbrainzRecordingID: Maybe<string>
  musicbrainzAlbumID: Maybe<string>
  musicbrainzArtistIDs: string[]
  musicbrainzAlbumArtistIDs: string[]

  duration: Maybe<number>
  bitdepth: Maybe<number>
  bitrate: Maybe<number>
  sampleRate: Maybe<number>
  trackOffset: number

  hasEmbeddedAlbumart: boolean
}

type Maybe<T> = T | null

export type ArgumentsType<F extends Function> = F extends (
  ...args: infer A
) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
any
  ? A
  : never

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PromiseType<T extends Promise<any>> = T extends Promise<infer U>
  ? U
  : never

export type ObservablePersistencyPort = CombineObjects<
  PersistencyPort,
  {
    usecaseExecutions: {
      queries: Observable<QueryUsecaseExecutionReport>
      mutations: Observable<MutationUsecaseExecutionReport>
      all: Observable<UsecaseExecutionReport>
    }
  }
>

export type QueryUsecaseExecutionReport = UnionizeProperties<
  Pick<
    APIExecutionReportsByUsecase,
    | 'getAllMediaFilesInFolder'
    | 'getAllMountPoints'
    | 'getAllMountPointsWithStats'
    | 'getMountPointStats'
  >
>

export type MutationUsecaseExecutionReport = UnionizeProperties<
  Pick<
    APIExecutionReportsByUsecase,
    | 'addPendingMediaFiles'
    | 'deleteMediaFiles'
    | 'deleteMountPoint'
    | 'setMediaFileFavoriteState'
    | 'setMediaFileProcessingStatusToError'
    | 'updateMediaFileMetadata'
  >
>

export type UsecaseExecutionReport = UnionizeProperties<
  APIExecutionReportsByUsecase
>

export type APIExecutionReportsByUsecase = {
  [k in keyof PersistencyPort]: PersistencyPort[k] extends Function
    ? {
        usecase: k
        duration: number
        arguments: ArgumentsType<PersistencyPort[k]>
        outcome: PromiseType<ReturnType<PersistencyPort[k]>>
      }
    : never
}
