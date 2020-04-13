import { ChildProcess, spawn } from 'child_process'
import { Either, left } from 'fp-ts/lib/Either'
import { cpus } from 'os'
import path from 'path'
import { filter } from 'rxjs/operators'
import * as zmq from 'zeromq'

import { SOCKET_ADDRESS } from './constants'
import { JobQueue } from './JobQueue'
import { ResponseStream } from './ResponseStream'
import { Job, JobSuccess } from './Worker/types'

const WORKERS_NUMBER = cpus().length
const WORKER_MAIN = path.resolve(__dirname, 'Worker', 'main')

const workersSet = new Set<ChildProcess>()

process.on('exit', () => {
  workersSet.forEach((worker) => worker.kill())
})

function spawnWorker(isTypescript: boolean) {
  const worker = spawn(
    'node',
    isTypescript
      ? ['-r', 'ts-node/register', `${WORKER_MAIN}.ts`]
      : [`${WORKER_MAIN}.js`],
    {
      env: process.env,
      stdio: 'inherit',
    },
  )

  workersSet.add(worker)

  console.log(`MetadataProcessing worker [${worker.pid}]: spawned`)
  worker.once('exit', () => {
    workersSet.delete(worker)
    spawnWorker(isTypescript)
  })
}

function startWorkers(isTypescript: boolean) {
  for (let i = 0; i < WORKERS_NUMBER; i++) {
    spawnWorker(isTypescript)
  }
}

export const MetadataProcessing = ({
  isTypescript,
}: Config): MetadataProcessing => {
  const dealer = zmq.socket('dealer')
  const jobQueue = JobQueue(dealer)
  const responseStream = ResponseStream(dealer)

  return {
    boot: async () => {
      startWorkers(isTypescript)
      return new Promise((resolve, reject) => {
        dealer.bind(SOCKET_ADDRESS, (error) => {
          if (error) {
            reject(new Error(error))
          } else {
            console.log('MetadataProcessing dealer: bound')
            resolve()
          }
        })
      })
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
  ) => Promise<Either<'TIMEOUT' | Error, ProcessedFile>>
}

type Config = {
  isTypescript: boolean
}

export type ProcessedFile = JobSuccess['file']
