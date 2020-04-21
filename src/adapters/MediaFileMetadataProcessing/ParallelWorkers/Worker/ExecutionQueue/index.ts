import { queue } from 'async'
import { isLeft } from 'fp-ts/lib/Either'

import { debug } from '../debug'
import { execution, ExecutionResult, JobToExecute } from './execution'

/**
 * This states how many files a worker
 * can process concurrently
 */
const MAX_CONCURRENT_PROCESSING = 4

export const ExecutionQueue = (): ExecutionQueue => {
  const internalQueue = queue(execution, MAX_CONCURRENT_PROCESSING)

  return {
    add: (job) =>
      new Promise((resolve) => {
        debug.info.enabled &&
          debug.info(
            `[QUEUED] Job %s for file %s/%s`,
            job.id.toString(),
            job.file.folder,
            job.file.name,
          )
        internalQueue.push<ExecutionResult>(job, (_, result) => {
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

export type ExecutionQueue = {
  add: (job: JobToExecute) => Promise<ExecutionResult>
}

export { JobToExecute, ExecutionResult, SuccessfulJob } from './execution'
