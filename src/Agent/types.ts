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
    allTracksByAlbum: (album: {
      artist: string
      title: string
    }) => Promise<Either<'PERSISTENCY_FAILURE', Track[]>>
    allTracksByArtist: (artist: {
      name: string
    }) => Promise<Either<'PERSISTENCY_FAILURE', Track[]>>
    allTracksByComposer: (composer: {
      name: string
    }) => Promise<Either<'PERSISTENCY_FAILURE', Track[]>>
    allTracksByGenre: (genre: {
      name: string
    }) => Promise<Either<'PERSISTENCY_FAILURE', Track[]>>
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
  favorite: boolean
  file: TrackFile
  metadata: TrackMetadata
  offset: number
}

export type TrackFile = {
  folder: string
  hasEmbeddedAlbumart: boolean
  modifiedOn: Date
  name: string
  size: number
  type: string
}

export type TrackMetadata = {
  title: Maybe<string>
  artists: string[]
  albumArtist: Maybe<string>
  composers: string[]
  album: Maybe<string>
  genres: string[]
  trackNumber: Maybe<number>
  diskNumber: Maybe<number>
  year: Maybe<number>

  musicbrainz: {
    trackID: Maybe<string>
    recordingID: Maybe<string>
    albumID: Maybe<string>
    artistIDs: string[]
    albumArtistIDs: string[]
  }

  duration: Maybe<number>
  bitdepth: Maybe<number>
  bitrate: Maybe<number>
  sampleRate: Maybe<number>
}

type Maybe<T> = T | null
