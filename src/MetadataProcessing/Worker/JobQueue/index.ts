import { queue } from 'async'

import { Job, jobProcessing, JobResult } from './jobProcessing'

/**
 * This states how many files a worker
 * can process concurrently
 */
const MAX_CONCURRENT_PROCESSING = 2

export const JobQueue = (): JobQueue => {
  const internalQueue = queue(jobProcessing, MAX_CONCURRENT_PROCESSING)

  return {
    process: (job) =>
      new Promise((resolve) =>
        internalQueue.push<JobResult>(job, (_, result) => resolve(result)),
      ),
  }
}

export type JobQueue = {
  process: (job: Job) => Promise<JobResult>
}

export { Job, JobResult, JobSuccess } from './jobProcessing'
