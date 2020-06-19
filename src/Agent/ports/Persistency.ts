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
  addPendingMediaFilesToFolder: (
    folder: FolderID,
    files: MediaFileToAddToFolder[],
  ) => Promise<Either<'PERSISTENCY_FAILURE', MediaFile[]>>

  /**
   * Ensures a set of MediaFile(s) is no longer present
   */
  deleteMediaFiles: (
    mediaFileIDs: MediaFileID[],
  ) => Promise<Either<'PERSISTENCY_FAILURE', void>>

  /**
   * Ensures a MountPoint and all of its mediafiles are no longer present
   */
  deleteMountPoint: (
    mountPointID: MountPointID,
  ) => Promise<Either<'PERSISTENCY_FAILURE', void>>

  /**
   * Retrieves the list of knowed MountPoint(s)
   */
  getAllMountPoints: () => Promise<
    Either<'PERSISTENCY_FAILURE', MountPointID[]>
  >

  getAllMountPointsWithStats: () => Promise<
    Either<'PERSISTENCY_FAILURE', MountPointWithStats[]>
  >

  /**
   * Retrieves the list of MediaFile(s) contained
   * in a given Folder
   */
  getMediaFilesInFolder: (
    folderID: FolderID,
  ) => Promise<Either<'PERSISTENCY_FAILURE', MediaFile[]>>

  /**
   * Retrieves statistics about a MountPoint
   */
  getMountPointStats: (
    mountPointID: MountPointID,
  ) => Promise<
    Either<'PERSISTENCY_FAILURE' | 'MOUNT_POINT_NOT_FOUND', MountPointStats>
  >

  /**
   * Sets the favorite state of a MediaFile
   */
  setMediaFileFavoriteState: (
    mediaFileID: MediaFileID,
    state: boolean,
  ) => Promise<
    Either<'PERSISTENCY_FAILURE' | 'MEDIA_FILE_NOT_FOUND', MediaFile>
  >

  /**
   * Sets the processing status of a MediaFile to ERROR
   */
  setMediaFileProcessingStatusToError: (
    mediaFileID: MediaFileID,
  ) => Promise<
    Either<'PERSISTENCY_FAILURE' | 'MEDIA_FILE_NOT_FOUND', MediaFile>
  >

  /**
   * Updates the metadata of a MediaFIle
   */
  updateMediaFileMetadata: (
    mediaFileID: MediaFileID,
    metadata: MediaFileMetadata,
  ) => Promise<
    Either<'PERSISTENCY_FAILURE' | 'MEDIA_FILE_NOT_FOUND', MediaFile>
  >
}

export type MountPointWithStats = CombineObjects<
  {
    path: MountPointID
  },
  MountPointStats
>

export type MountPointID = string

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

export type FolderID = {
  mountPoint: MountPointID
  folder: string
}

export type MediaFileToAddToFolder = {
  name: string
  binary: MediaFileBinaryInfos
}

export type MediaFile = {
  id: MediaFileID
  path: string
  processingStatus: MediaFileBinaryProcessingStatus
  binary: MediaFileBinaryInfos
  favorite: boolean
  metadata: MediaFileMetadata
}

export type MediaFileID = CombineObjects<
  FolderID,
  {
    name: string
  }
>

export type MediaFileBinaryInfos = {
  size: number
  modifiedOn: Date
}

export enum MediaFileBinaryProcessingStatus {
  DONE = 'DONE',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}

export type MediaFileMetadata = {
  title: Maybe<string>
  artist: Maybe<string>
  albumArtist: Maybe<string>
  composers: string[]
  album: Maybe<string>
  trackNumber: Maybe<number>
  diskNumber: Maybe<number>
  year: Maybe<number>

  musicbrainzID: Maybe<string>
  musicbrainzAlbumID: Maybe<string>
  musicbrainzArtistIDs: string[]
  musicbrainzAlbumArtistIDs: string[]

  duration: Maybe<number>
  bitdepth: Maybe<number>
  bitrate: Maybe<number>
  sampleRate: Maybe<number>
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
    'getAllMountPoints' | 'getMediaFilesInFolder' | 'getMountPointStats'
  >
>

export type MutationUsecaseExecutionReport = UnionizeProperties<
  Pick<
    APIExecutionReportsByUsecase,
    | 'addPendingMediaFilesToFolder'
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