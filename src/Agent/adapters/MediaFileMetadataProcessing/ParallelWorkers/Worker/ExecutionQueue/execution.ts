import { AsyncResultIterator } from 'async'
import { Either, left, right } from 'fp-ts/lib/Either'
import * as mm from 'music-metadata'
import path from 'path'
import { CombineObjects } from 'simplytyped'

export const execution: AsyncResultIterator<
  JobToExecute,
  ExecutionResult,
  never
> = async (job, done) => {
  const filePath = path.resolve(job.file.folder, job.file.name)

  try {
    const metadata = await mm.parseFile(filePath, {
      duration: false,
    })

    done(
      null,
      right({
        ...job,
        file: {
          ...job.file,
          metadata,
        },
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
      }
    >
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
