import { queue } from 'async'
import { isLeft } from 'fp-ts/lib/Either'

import { debug } from '../debug'
import { Job, jobProcessing, JobResult } from './jobProcessing'

/**
 * This states how many files a worker
 * can process concurrently
 */
const MAX_CONCURRENT_PROCESSING = 3

export const JobQueue = (): JobQueue => {
  const internalQueue = queue(jobProcessing, MAX_CONCURRENT_PROCESSING)

  return {
    process: (job) =>
      new Promise((resolve) => {
        debug.info.enabled &&
          debug.info(
            `[QUEUED] Job %s for file %s/%s`,
            job.id.toString(),
            job.file.folder,
            job.file.name,
          )
        internalQueue.push<JobResult>(job, (_, result) => {
          if (debug.info.enabled && result) {
            if (isLeft(result)) {
              debug.error(
                `[ERROR]: Job %s for file %s/%s: %s`,
                job.id.toString(),
                job.file.folder,
                job.file.name,
                result.left.error.message,
              )
            } else {
              debug.info(
                `[SUCCESS]: Job %s for file %s/%s`,
                job.id.toString(),
                job.file.folder,
                job.file.name,
              )
            }
          }
          resolve(result)
        })
      }),
  }
}

export type JobQueue = {
  process: (job: Job) => Promise<JobResult>
}

export { Job, JobResult, JobSuccess } from './jobProcessing'
