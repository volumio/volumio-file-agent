import { AsyncResultIterator } from 'async'
import { Either, left, right } from 'fp-ts/lib/Either'
import * as mm from 'music-metadata'
import path from 'path'

export const jobProcessing: AsyncResultIterator<Job, JobResult, never> = async (
  job,
  done,
) => {
  const jobInfos: JobInfos = {
    id: job.id,
    requester: job.requester,
  }

  const filePath = path.resolve(job.file.folder, job.file.name)

  try {
    const metadata = await mm.parseFile(filePath, {
      duration: true,
    })

    done(
      null,
      right({
        id: job.id,
        requester: job.requester,
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
        ...jobInfos,
        error,
      }),
    )
  }
}

type JobInfos = {
  id: Buffer
  requester: Buffer
}

export type Job = JobInfos & {
  file: FileToParse
}

export type JobResult = Either<JobError, JobSuccess>

export type JobSuccess = JobInfos & {
  file: ParsedFile
}

export type JobError = JobInfos & {
  error: Error
}

export type FileToParse = {
  folder: string
  name: string
}

export type ParsedFile = FileToParse & {
  metadata: mm.IAudioMetadata
}
