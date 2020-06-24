import {
  MediaFile,
  MediaFileBinaryProcessingStatus,
} from '@Agent/ports/Persistency'
import { Database, Statement } from 'better-sqlite3'

import { MEDIAFILE_PROPS } from './const'

export const makeStatements = (db: Database): Statements => ({
  addMediaFile: db.prepare(`
    INSERT INTO mediaFiles
      (mountPoint, folder, name, processingStatus, size, modifiedOn, artists, composers, genres, musicbrainzArtistIDs, musicbrainzAlbumArtistIDs, trackOffset)
    VALUES
      (@mountPoint, @folder, @name, 'PENDING', @size, @modifiedOn, '[]', '[]', '[]', '[]', '[]', 0)
  `),
  deleteMediaFile: db.prepare(`
    DELETE
    FROM mediaFiles
    WHERE
      mountPoint = @mountPoint AND
      folder = @folder AND
      name = @name
  `),
  deleteAllMediaFilesByMountPoint: db.prepare(`
    DELETE
    FROM mediaFiles
    WHERE
      mountPoint = @mountPoint
  `),
  getAllAlbumArtists: db.prepare(`
    SELECT
      DISTINCT albumArtist
    FROM 
      mediaFiles
    WHERE
      albumArtist IS NOT NULL
  `),
  getAllAlbumArtistsByMountPoint: db.prepare(`
    SELECT
      DISTINCT albumArtist
    FROM 
      mediaFiles
    WHERE
      mountPoint = @mountPoint AND
      albumArtist IS NOT NULL
  `),
  getAllAlbumsInMountPoint: db.prepare(`
    SELECT
      DISTINCT album
    FROM
      mediaFiles
    WHERE
      mountPoint = @mountPoint AND
      album IS NOT NULL
  `),
  getAllArtists: db.prepare(`
    SELECT
      DISTINCT artists
    FROM 
      mediaFiles
  `),
  getAllArtistsByMountPoint: db.prepare(`
    SELECT
      DISTINCT artists
    FROM 
      mediaFiles
    WHERE
      mountPoint = @mountPoint
  `),
  getAllComposers: db.prepare(`
    SELECT
      DISTINCT composers
    FROM 
      mediaFiles
  `),
  getAllGenres: db.prepare(`
    SELECT
      DISTINCT genres
    FROM 
      mediaFiles
  `),
  getAllMediaFilesByAlbum: db.prepare(`
    SELECT
      ${MEDIAFILE_PROPS.join(',')}
    FROM mediaFiles
    WHERE
      album = @album
  `),
  getAllMediaFilesInFolder: db.prepare(`
    SELECT
      ${MEDIAFILE_PROPS.join(',')}
    FROM mediaFiles
    WHERE
      folder = @folder
  `),
  getAllMountPoints: db.prepare(`
    SELECT
      DISTINCT mountPoint
    FROM mediaFiles
  `),
  getMediaFile: db.prepare(`
    SELECT
      ${MEDIAFILE_PROPS.join(',')}
    FROM mediaFiles
    WHERE
      mountPoint = @mountPoint AND
      folder = @folder AND
      name = @name
  `),
  getMountPointProcessingStats: db.prepare(`
    SELECT
      processingStatus,
      COUNT(*) as total
    FROM mediaFiles
    WHERE
      mountPoint = @mountPoint
  `),
  getTotalMusicDurationByMountPoint: db.prepare(`
    SELECT
      SUM(duration) as totalDuration
    FROM mediaFiles
    WHERE
      mountPoint = @mountPoint AND
      duration IS NOT NULL
  `),
  setMediaFileProcessingStatusToError: db.prepare(`
    UPDATE mediaFiles
    SET
      processingStatus = 'ERROR'
    WHERE
      mountPoint = @mountPoint AND
      folder = @folder AND
      name = @name
  `),
  setMediaFileProcessingStatusToPending: db.prepare(`
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
  updateMediaFileFavoriteState: db.prepare(`
    UPDATE mediaFiles
    SET
      favorite = @favorite
    WHERE
      mountPoint = @mountPoint AND
      folder = @folder AND
      name = @name
  `),
  updateMediaFileMetadata: db.prepare(`
    UPDATE mediaFiles
    SET
      processingStatus = 'DONE',
      
      title = @title,
      artists = @artists,
      albumArtist = @albumArtist,
      composers = @composers,
      album = @album,
      genres = @genres,
      trackNumber = @trackNumber,
      diskNumber = @diskNumber,
      year = @year,

      musicbrainzTrackID = @musicbrainzTrackID,
      musicbrainzRecordingID = @musicbrainzRecordingID,
      musicbrainzAlbumID = @musicbrainzAlbumID,
      musicbrainzArtistIDs = @musicbrainzArtistIDs,
      musicbrainzAlbumArtistIDs = @musicbrainzAlbumArtistIDs,

      duration = @duration,
      bitdepth = @bitdepth,
      bitrate = @bitrate,
      sampleRate = @sampleRate,
      trackOffset = @trackOffset,

      hasEmbeddedAlbumart = @hasEmbeddedAlbumart
    WHERE
      mountPoint = @mountPoint AND
      folder = @folder AND
      name = @name
  `),
})

export type Statements = {
  addMediaFile: Statement<{
    mountPoint: string
    folder: string
    name: string
    size: number
    modifiedOn: string
  }>
  deleteMediaFile: Statement<{
    mountPoint: string
    folder: string
    name: string
  }>
  deleteAllMediaFilesByMountPoint: Statement<{
    mountPoint: string
  }>
  getAllAlbumArtists: Statement<[]>
  getAllAlbumArtistsByMountPoint: Statement<{
    mountPoint: string
  }>
  getAllAlbumsInMountPoint: Statement<{
    mountPoint: string
  }>
  getAllArtists: Statement<[]>
  getAllArtistsByMountPoint: Statement<{
    mountPoint: string
  }>
  getAllComposers: Statement<[]>
  getAllGenres: Statement<[]>
  getAllMediaFilesByAlbum: Statement<{
    album: string
  }>
  getAllMediaFilesInFolder: Statement<{
    folder: string
  }>
  getAllMountPoints: Statement<[]>
  getMediaFile: Statement<{
    mountPoint: string
    folder: string
    name: string
  }>
  getMountPointProcessingStats: Statement<{
    mountPoint: string
  }>
  getTotalMusicDurationByMountPoint: Statement<{
    mountPoint: string
  }>
  setMediaFileProcessingStatusToError: Statement<{
    mountPoint: string
    folder: string
    name: string
  }>
  setMediaFileProcessingStatusToPending: Statement<{
    mountPoint: string
    folder: string
    name: string
    size: number
    modifiedOn: string
  }>
  updateMediaFileFavoriteState: Statement<{
    mountPoint: string
    folder: string
    name: string
    favorite: 0 | 1
  }>
  updateMediaFileMetadata: Statement<{
    mountPoint: string
    folder: string
    name: string

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
  }>
}

export type MediaFileRecord = {
  mountPoint: string
  folder: string
  name: string

  size: number
  modifiedOn: string

  processingStatus: string
  favorite: 0 | 1

  title: Maybe<string>
  artists: string
  albumArtist: Maybe<string>
  composers: string
  album: Maybe<string>
  genres: string
  trackNumber: Maybe<number>
  diskNumber: Maybe<number>
  year: Maybe<number>

  musicbrainzTrackID: Maybe<string>
  musicbrainzRecordingID: Maybe<string>
  musicbrainzAlbumID: Maybe<string>
  musicbrainzArtistIDs: string
  musicbrainzAlbumArtistIDs: string

  duration: Maybe<number>
  bitdepth: Maybe<number>
  bitrate: Maybe<number>
  sampleRate: Maybe<number>
  trackOffset: number

  hasEmbeddedAlbumart: 0 | 1
}

type Maybe<T> = T | null

export const mediaFileRecordToPortMediaFile = (
  record: MediaFileRecord,
): MediaFile => ({
  album: record.album,
  albumArtist: record.albumArtist,
  artists: JSON.parse(record.artists),
  bitdepth: record.bitdepth,
  bitrate: record.bitrate,
  composers: JSON.parse(record.composers),
  diskNumber: record.diskNumber,
  duration: record.duration,
  favorite: Boolean(record.favorite),
  folder: record.folder,
  genres: JSON.parse(record.genres),
  hasEmbeddedAlbumart: Boolean(record.hasEmbeddedAlbumart),
  modifiedOn: new Date(record.modifiedOn),
  mountPoint: record.mountPoint,
  musicbrainzAlbumArtistIDs: JSON.parse(record.musicbrainzAlbumArtistIDs),
  musicbrainzAlbumID: record.musicbrainzAlbumID,
  musicbrainzArtistIDs: JSON.parse(record.musicbrainzArtistIDs),
  musicbrainzRecordingID: record.musicbrainzRecordingID,
  musicbrainzTrackID: record.musicbrainzTrackID,
  name: record.name,
  processingStatus: record.processingStatus as MediaFileBinaryProcessingStatus,
  sampleRate: record.sampleRate,
  size: record.size,
  title: record.title,
  trackNumber: record.trackNumber,
  trackOffset: record.trackOffset,
  year: record.year,
})

export const portMediaFileToMediaFileRecord = (
  mediaFile: MediaFile,
): MediaFileRecord => ({
  album: mediaFile.album,
  albumArtist: mediaFile.albumArtist,
  artists: JSON.stringify(mediaFile.artists),
  bitdepth: mediaFile.bitdepth,
  bitrate: mediaFile.bitrate,
  composers: JSON.stringify(mediaFile.composers),
  diskNumber: mediaFile.diskNumber,
  duration: mediaFile.duration,
  favorite: mediaFile.favorite ? 1 : 0,
  folder: mediaFile.folder,
  genres: JSON.stringify(mediaFile.genres),
  hasEmbeddedAlbumart: mediaFile.hasEmbeddedAlbumart ? 1 : 0,
  modifiedOn: mediaFile.modifiedOn.toISOString(),
  mountPoint: mediaFile.mountPoint,
  musicbrainzAlbumArtistIDs: JSON.stringify(
    mediaFile.musicbrainzAlbumArtistIDs,
  ),
  musicbrainzAlbumID: mediaFile.musicbrainzAlbumID,
  musicbrainzArtistIDs: JSON.stringify(mediaFile.musicbrainzArtistIDs),
  musicbrainzRecordingID: mediaFile.musicbrainzRecordingID,
  musicbrainzTrackID: mediaFile.musicbrainzTrackID,
  name: mediaFile.name,
  processingStatus: mediaFile.processingStatus,
  sampleRate: mediaFile.sampleRate,
  size: mediaFile.size,
  title: mediaFile.title,
  trackNumber: mediaFile.trackNumber,
  trackOffset: mediaFile.trackOffset,
  year: mediaFile.year,
})
