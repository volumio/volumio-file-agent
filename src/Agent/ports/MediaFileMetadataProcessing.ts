import { MediaFileMetadata } from '@Agent/ports/Persistency'
import { Either } from 'fp-ts/lib/Either'
import { CombineObjects } from 'simplytyped'

export type MediaFileMetadataProcessingPort = {
  processMediaFile: (
    file: MediaFileToProcess,
    timeout?: number,
  ) => Promise<Either<'TIMEOUT' | ProcessingError, ProcessedMediaFile>>
}

export type MediaFileToProcess = {
  folder: string
  name: string
}

export type ProcessedMediaFile = CombineObjects<
  MediaFileToProcess,
  {
    metadata: MediaFileMetadata
  }
>

export type ProcessingError = {
  name: string
  message: string
  stack?: string
}
