import { AsyncResultIterator } from 'async'
import { Either, isLeft, right } from 'fp-ts/lib/Either'
import now from 'performance-now'

import {
  MediaFileMetadataProcessingPort,
  ProcessedMediaFile,
  ProcessingError,
} from '../../ports/MediaFileMetadataProcessing'
import { MediaFile, PersistencyPort } from '../../ports/Persistency'

export const Execution = ({
  persistency,
  processMediaFile,
}: Dependencies): AsyncResultIterator<
  MediaFile,
  ExecutionReport,
  never
> => async (mediaFile, done) => {
  const start = now()

  const processingResult = await processMediaFile({
    folder: mediaFile.id.folder,
    name: mediaFile.id.name,
  })

  if (isLeft(processingResult)) {
    await persistency.setMediaFileProcessingStatusToError(mediaFile.id)

    done(null, {
      duration: getDurationFrom(start),
      result: processingResult,
    })
  } else {
    const {
      right: { metadata },
    } = processingResult

    const updateDBResult = await persistency.updateMediaFileMetadata(
      mediaFile.id,
      fromProcessedMetadataToMediafileMetadata(metadata),
    )

    done(null, {
      duration: getDurationFrom(start),
      result: isLeft(updateDBResult) ? updateDBResult : right(undefined),
    })
  }
}

const getDurationFrom = (start: number) => now() - start

const fromProcessedMetadataToMediafileMetadata = (
  metadata: ProcessedMediaFile['metadata'],
): MediaFile['metadata'] => ({
  title: metadata.common.title || null,
  artist: metadata.common.artist || null,
  albumArtist: metadata.common.albumartist || null,
  composers: metadata.common.composer || [],
  album: metadata.common.album || null,
  trackNumber: metadata.common.track.no,
  diskNumber: metadata.common.disk.no,
  year: metadata.common.year || null,

  musicbrainzID: metadata.common.musicbrainz_trackid || null,
  musicbrainzAlbumID: metadata.common.musicbrainz_albumid || null,
  musicbrainzArtistIDs: metadata.common.musicbrainz_artistid || [],
  musicbrainzAlbumArtistIDs: metadata.common.musicbrainz_albumartistid || [],

  duration: metadata.format.duration || null,
  bitdepth: metadata.format.bitsPerSample || null,
  bitrate: metadata.format.bitrate || null,
  sampleRate: metadata.format.sampleRate || null,
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
