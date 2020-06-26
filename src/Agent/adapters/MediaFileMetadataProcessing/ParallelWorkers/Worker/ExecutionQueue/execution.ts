import { AsyncResultIterator } from 'async'
import { Either, left, right } from 'fp-ts/lib/Either'
import * as mm from 'music-metadata'
import path from 'path'
import now from 'performance-now'
import { CombineObjects } from 'simplytyped'

import { debug } from '../debug'

export const execution: AsyncResultIterator<
  JobToExecute,
  ExecutionResult,
  never
> = async (job, done) => {
  const filePath = path.resolve(job.file.folder, job.file.name)

  try {
    const start = debug.info.enabled ? now() : 0
    const metadata = await mm.parseFile(filePath, {
      duration: false,
    })

    done(
      null,
      right({
        ...job,
        file: {
          ...job.file,
          metadata: {
            ...metadata,
            common: {
              ...metadata.common,
              picture: undefined,
            },
          },
          hasEmbeddedAlbumart:
            metadata.common.picture !== undefined &&
            metadata.common.picture.length > 0,
        },
        milliseconds: debug.info.enabled ? now() - start : 0,
      }),
    )
  } catch (error) {
    done(
      null,
      left({
        ...job,
        error,
      }),
    )
  }
}

export type ExecutionResult = Either<FailedJob, SuccessfulJob>

export type JobToExecute = CombineObjects<
  JobInfos,
  {
    file: FileToProcess
  }
>

export type FailedJob = CombineObjects<
  JobToExecute,
  {
    error: Error
  }
>

export type SuccessfulJob = CombineObjects<
  JobToExecute,
  {
    file: CombineObjects<
      FileToProcess,
      {
        metadata: mm.IAudioMetadata
        hasEmbeddedAlbumart: boolean
      }
    >
    milliseconds: number
  }
>

type JobInfos = {
  id: Buffer
  requester: Buffer
}

type FileToProcess = {
  folder: string
  name: string
}
