import {
  MediaFileMetadataProcessingPort,
  ProcessedMediaFile,
  ProcessingError,
} from '@Agent/ports/MediaFileMetadataProcessing'
import {
  MediaFile,
  MediaFileMetadata,
  PersistencyPort,
} from '@Agent/ports/Persistency'
import { AsyncResultIterator } from 'async'
import { Either, isLeft, right } from 'fp-ts/lib/Either'
import now from 'performance-now'

export const Execution = ({
  persistency,
  processMediaFile,
}: Dependencies): AsyncResultIterator<
  MediaFile,
  ExecutionReport,
  never
> => async (mediaFile, done) => {
  const start = now()

  const processingResult = await processMediaFile(
    {
      folder: mediaFile.folder,
      name: mediaFile.name,
    },
    20000,
  )

  if (isLeft(processingResult)) {
    await persistency.setMediaFileProcessingStatusToError({
      mountPoint: mediaFile.mountPoint,
      folder: mediaFile.folder,
      name: mediaFile.name,
    })

    done(null, {
      duration: getDurationFrom(start),
      result: processingResult,
    })
  } else {
    const processedMediaFile = processingResult.right

    const updateDBResult = await persistency.updateMediaFileMetadata(
      {
        mountPoint: mediaFile.mountPoint,
        folder: mediaFile.folder,
        name: mediaFile.name,
      },
      fromProcessedMediaFileToMediaFileMetadata(processedMediaFile),
    )

    done(null, {
      duration: getDurationFrom(start),
      result: isLeft(updateDBResult) ? updateDBResult : right(undefined),
    })
  }
}

const getDurationFrom = (start: number) => now() - start

const fromProcessedMediaFileToMediaFileMetadata = ({
  metadata,
  hasEmbeddedAlbumart,
}: ProcessedMediaFile): MediaFileMetadata => ({
  title: metadata.common.title || null,
  artists:
    metadata.common.artists && metadata.common.artists.length
      ? metadata.common.artists.sort()
      : metadata.common.artist
      ? [metadata.common.artist]
      : [],
  albumArtist: metadata.common.albumartist
    ? metadata.common.albumartist
    : metadata.common.artists && metadata.common.artists.length
    ? metadata.common.artists[0]
    : metadata.common.artist || null,
  composers: metadata.common.composer ? metadata.common.composer.sort() : [],
  album: metadata.common.album || null,
  genres: metadata.common.genre ? metadata.common.genre.sort() : [],
  trackNumber: metadata.common.track.no,
  diskNumber: metadata.common.disk.no,
  year: metadata.common.year || null,

  musicbrainzTrackID: metadata.common.musicbrainz_trackid || null,
  musicbrainzRecordingID: metadata.common.musicbrainz_recordingid || null,
  musicbrainzAlbumID: metadata.common.musicbrainz_albumid || null,
  musicbrainzArtistIDs: metadata.common.musicbrainz_artistid
    ? metadata.common.musicbrainz_artistid.sort()
    : [],
  musicbrainzAlbumArtistIDs: metadata.common.musicbrainz_albumartistid
    ? metadata.common.musicbrainz_albumartistid.sort()
    : [],

  duration:
    metadata.format.duration !== undefined
      ? Math.round(metadata.format.duration)
      : null,
  bitdepth: metadata.format.bitsPerSample || null,
  bitrate: metadata.format.bitrate ? Math.round(metadata.format.bitrate) : null,
  sampleRate: metadata.format.sampleRate || null,
  trackOffset: 0,

  hasEmbeddedAlbumart,
})

export type ExecutionReport = {
  duration: number
  result: Either<
    | 'PERSISTENCY_FAILURE'
    | 'MEDIA_FILE_NOT_FOUND'
    | 'TIMEOUT'
    | ProcessingError,
    void
  >
}

export type Dependencies = {
  persistency: PersistencyPort
  processMediaFile: MediaFileMetadataProcessingPort['processMediaFile']
}
