import { DatabasePort, MediaFile } from '@ports/Database'
import {
  MediaFileMetadataProcessingPort,
  ProcessedMediaFile,
  ProcessingError,
} from '@ports/MediaFileMetadataProcessing'
import { AsyncResultIterator } from 'async'
import { Either, isLeft, right } from 'fp-ts/lib/Either'
import now from 'performance-now'

export const Execution = ({
  db,
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
    done(null, {
      duration: getDurationFrom(start),
      result: processingResult,
    })
  } else {
    const {
      right: { metadata },
    } = processingResult
    const updateDBResult = await db.updateMediaFileMetadata(
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
  album: metadata.common.album || null,
  albumArtist: metadata.common.albumartist || null,
  artist: metadata.common.artist || null,
  composer: metadata.common.compilation || null,
  diskNumber: metadata.common.disk.no,
  duration: metadata.format.duration || null,
  sampleRate: metadata.format.sampleRate || null,
  title: metadata.common.title || null,
  trackNumber: metadata.common.track.no,
  year: metadata.common.year || null,
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
  db: DatabasePort
  processMediaFile: MediaFileMetadataProcessingPort['processMediaFile']
}
