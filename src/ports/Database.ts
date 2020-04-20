import { Either } from 'fp-ts/lib/Either'
import { Observable } from 'rxjs'
import { CombineObjects, UnionizeProperties } from 'simplytyped'

export type ObservableDatabasePort = CombineObjects<
  DatabasePort,
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
    | 'deleteMediaFiles'
    | 'deleteMountPoint'
    | 'setMediaFileFavoriteState'
    | 'updateMediaFileMetadata'
  >
>

export type UsecaseExecutionReport = UnionizeProperties<
  APIExecutionReportsByUsecase
>

export type APIExecutionReportsByUsecase = {
  [k in keyof DatabasePort]: DatabasePort[k] extends Function
    ? {
        usecase: k
        duration: number
        arguments: ArgumentsType<DatabasePort[k]>
        outcome: PromiseType<ReturnType<DatabasePort[k]>>
      }
    : never
}

export type DatabasePort = {
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
   * Updates the metadata of a MediaFIle
   */
  updateMediaFileMetadata: (
    mediaFileID: MediaFileID,
    metadata: MediaFileMetadata,
  ) => Promise<
    Either<'PERSISTENCY_FAILURE' | 'MEDIA_FILE_NOT_FOUND', MediaFile>
  >
}

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

export type MediaFile = {
  id: MediaFileID
  path: string
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
  processingStatus: MediaFileBinaryProcessingStatus
  size: number
  modifiedOn: Date
}

export enum MediaFileBinaryProcessingStatus {
  DONE = 'DONE',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}

export type MediaFileMetadata = NullableProps<{
  title: string
  duration: number
  sampleRate: number
  artist: string
  albumArtist: string
  composer: string
  album: string
  trackNumber: number
  diskNumber: number
  year: number
}>

type NullableProps<T> = {
  [k in keyof T]: T[k] | null
}

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
