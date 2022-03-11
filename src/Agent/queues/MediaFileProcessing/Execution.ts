import {
  MediaFileMetadataProcessingPort,
  ProcessingError,
} from '@Agent/ports/MediaFileMetadataProcessing'
import { MediaFile, PersistencyPort } from '@Agent/ports/Persistency'
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
    const processedMediaFileMetadata = processingResult.right.metadata

    const updateDBResult = await persistency.updateMediaFileMetadata(
      {
        mountPoint: mediaFile.mountPoint,
        folder: mediaFile.folder,
        name: mediaFile.name,
      },
      processedMediaFileMetadata,
    )

    done(null, {
      duration: getDurationFrom(start),
      result: isLeft(updateDBResult) ? updateDBResult : right(undefined),
    })
  }
}

const getDurationFrom = (start: number) => now() - start

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
