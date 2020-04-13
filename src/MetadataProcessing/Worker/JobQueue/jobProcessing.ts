import { AsyncResultIterator } from 'async'
import { Either, isLeft, left, right } from 'fp-ts/lib/Either'
import * as mm from 'music-metadata'
import path from 'path'

import { checksum } from '../../../fs'

export const jobProcessing: AsyncResultIterator<Job, JobResult, never> = async (
  job,
  done,
) => {
  const jobInfos: JobInfos = {
    id: job.id,
    requester: job.requester,
  }

  const filePath = path.resolve(job.file.folder, job.file.name)

  const checksumResult = await checksum(filePath)

  if (isLeft(checksumResult)) {
    /**
     * The fact that we failed to caculate the checksum
     * means we've got problems reading the file,
     * so we consider the job failed.
     */
    done(
      null,
      left({
        ...jobInfos,
        error: checksumResult.left,
      }),
    )
  } else {
    const fileChecksum = checksumResult.right

    if (job.file.checksum !== undefined && fileChecksum === job.file.checksum) {
      /**
       * The checksum of the file is equal to the
       * one known by job requester,
       * so we do not process the file further.
       */
      return done(null, right(job as JobSuccess))
    }

    try {
      const metadata = await mm.parseFile(filePath, {
        duration: true,
      })

      done(
        null,
        right({
          ...jobInfos,
          file: {
            ...job.file,
            checksum: fileChecksum,
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
  checksum?: string
}

export type ParsedFile = FileToParse & {
  checksum: string
  metadata?: mm.IAudioMetadata
}
