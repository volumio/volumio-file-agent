import { spawn } from 'child_process'
import { Left, left } from 'fp-ts/lib/Either'
import { cpus } from 'os'
import path from 'path'
import { filter } from 'rxjs/operators'
import * as zmq from 'zeromq'

import { SOCKET_ADDRESS } from './constants'
import { JobQueue } from './JobQueue'
import { Response, ResponseStream } from './ResponseStream'
import { Job } from './Worker/types'

const WORKERS_NUMBER = cpus().length
const WORKER_MAIN = path.resolve(__dirname, 'Worker', 'main')

function spawnWorker(isTypescript: boolean) {
  const worker = spawn(
    'node',
    isTypescript
      ? ['-r', 'ts-node/register', `${WORKER_MAIN}.ts`]
      : [`${WORKER_MAIN}.js`],
  )

  console.log(`MetadataProcessing worker [${worker.pid}]: spawned`)
  // worker.stdout.pipe(process.stdout)
  worker.once('exit', spawnWorker)
}

function startWorkers(isTypescript: boolean) {
  for (let i = 0; i < WORKERS_NUMBER; i++) {
    spawnWorker(isTypescript)
  }
}

export const MetadataProcessing = ({
  isTypescript,
}: Config): MetadataProcessing => {
  const dealer = new zmq.Dealer()
  const jobQueue = JobQueue(dealer)
  const responseStream = ResponseStream(dealer)

  return {
    boot: async () => {
      startWorkers(isTypescript)
      await dealer.bind(SOCKET_ADDRESS)
      console.log('MetadataProcessing dealer: bound')
    },
    process: (file, timeout) =>
      new Promise(async (resolve) => {
        let resolved = false

        const requestId = jobQueue.enqueue(file)

        const subscription = responseStream
          .pipe(filter(({ id }) => id === requestId))
          .subscribe((response) => {
            if (!resolved) {
              resolved = true
              subscription.unsubscribe()
              resolve(response.result)
            }
          })

        if (timeout && timeout > 0) {
          setTimeout(() => {
            if (!resolved) {
              resolved = true
              subscription.unsubscribe()
              resolve(left('TIMEOUT'))
            }
          }, timeout)
        }
      }),
  }
}

export type MetadataProcessing = {
  boot: () => Promise<void>
  process: (
    file: Job['file'],
    timeout?: number,
  ) => Promise<Left<'TIMEOUT'> | Response['result']>
}

type Config = {
  isTypescript: boolean
}
