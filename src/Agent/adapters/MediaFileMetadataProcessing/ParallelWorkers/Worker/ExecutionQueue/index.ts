import { queue } from 'async'
import { isLeft } from 'fp-ts/lib/Either'

import { debug } from '../debug'
import { execution, ExecutionResult, JobToExecute } from './execution'

/**
 * This states how many files a worker
 * can process concurrently
 */
const MAX_CONCURRENT_PROCESSING = 1

export const ExecutionQueue = (): ExecutionQueue => {
  const internalQueue = queue(execution, MAX_CONCURRENT_PROCESSING)

  return {
    add: (job) =>
      new Promise((resolve) => {
        debug.info.enabled &&
          debug.info(
            `[QUEUED - %s] %s/%s`,
            job.id.toString(),
            job.file.folder,
            job.file.name,
          )
        internalQueue.push<ExecutionResult>(job, (_, result) => {
          if (debug.info.enabled && result) {
            if (isLeft(result)) {
              debug.error(
                `[ERROR - %s] "%s" for file %s/%s`,
                job.id.toString(),
                result.left.error.message,
                job.file.folder,
                job.file.name,
              )
            } else {
              debug.info(
                `[SUCCESS - %s] %s/%s`,
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
