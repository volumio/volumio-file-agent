import { Either } from 'fp-ts/lib/Either'
import { CombineObjects } from 'simplytyped'

import { MountPointEcosystemValidationError } from './utils/mountPointEcosystemValidation'
import { MountPointFSValidationError } from './utils/mountPointFSValidation'
import { MountPointPathValidationError } from './utils/mountPointPathValidation'

export interface AgentInterface {
  command: {
    addMountPoint: (
      mountPointPath: MountPointPath,
    ) => Promise<
      Either<MountPointValidationError | 'PERSISTENCY_FAILURE', void>
    >
    removeMountPoint: (
      mountPointPath: MountPointPath,
    ) => Promise<Either<'PERSISTENCY_FAILURE', void>>
  }

  query: {
    allArtistsNames: () => Promise<Either<'PERSISTENCY_FAILURE', string[]>>
    allComposersNames: () => Promise<Either<'PERSISTENCY_FAILURE', string[]>>
    allGenresNames: () => Promise<Either<'PERSISTENCY_FAILURE', string[]>>
    allTracksByAlbum: (
      albumName: string,
    ) => Promise<Either<'PERSISTENCY_FAILURE', Track[]>>
    allTracksByArtist: (
      artistName: string,
    ) => Promise<Either<'PERSISTENCY_FAILURE', Track[]>>
    allTracksByComposer: (
      composerName: string,
    ) => Promise<Either<'PERSISTENCY_FAILURE', Track[]>>
    allTracksByGenre: (
      genreName: string,
    ) => Promise<Either<'PERSISTENCY_FAILURE', Track[]>>
    allTracksByYear: (
      year: number,
    ) => Promise<Either<'PERSISTENCY_FAILURE', Track[]>>
    allTracksInFolder: (
      folderPath: string,
    ) => Promise<Either<'PERSISTENCY_FAILURE', Track[]>>
    allMountPoints: () => Promise<Either<'PERSISTENCY_FAILURE', MountPoint[]>>
    allYears: () => Promise<Either<'PERSISTENCY_FAILURE', number[]>>
    folderSubfolders: (folderPath: string) => Promise<Either<Error, string[]>>
  }
}

export enum MediaFileProcessingStatus {
  DONE = 'DONE',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}

export type MountPoint = CombineObjects<
  {
    path: MountPointPath
    processing: boolean
  },
  MountPointStats
>

export type MountPointPath = string

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

export type MountPointValidationError =
  | MountPointPathValidationError
  | MountPointFSValidationError
  | MountPointEcosystemValidationError

export type Track = {
  file: TrackFile
  metadata: TrackMetadata
  favorite: boolean
  offset: number
}

export type TrackFile = {
  folder: string
  modifiedOn: Date
  name: string
  size: number
}

export type TrackMetadata = {
  title: Maybe<string>
  artist: Maybe<string>
  albumArtist: Maybe<string>
  composers: string[]
  album: Maybe<string>
  genres: string[]
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
