import { ChildProcess, spawn } from 'child_process'
import { left } from 'fp-ts/lib/Either'
import { cpus } from 'os'
import path from 'path'
import { filter } from 'rxjs/operators'
import { CombineObjects } from 'simplytyped'
import * as zmq from 'zeromq'

import { MediaFileMetadataProcessingPort } from '../../../ports/MediaFileMetadataProcessing'
import { SOCKET_ADDRESS } from './constants'
import { debug } from './debug'
import { RequestsQueue } from './RequestsQueue'
import { ResponsesStream } from './ResponsesStream'

const IS_TYPESCRIPT = __filename.endsWith('ts')
const WORKERS_NUMBER = cpus().length
const WORKER_MAIN_FILE = path.resolve(
  __dirname,
  'Worker',
  `main.${IS_TYPESCRIPT ? 'ts' : 'js'}`,
)

export const ParallelWorkersMediaFileMetadataProcessingAdapter = async (): Promise<
  StoppablePort
> => {
  const dealer = zmq.socket('dealer')
  const requestsQueue = RequestsQueue(dealer)
  const responsesStream = ResponsesStream(dealer)

  /**
   * Here we mantain the set of active workers
   * in order to be able to kill them later
   */
  const workersSet = new Set<ChildProcess>()

  function spawnWorker() {
    const worker = spawn(
      'node',
      IS_TYPESCRIPT
        ? ['-r', 'ts-node/register', WORKER_MAIN_FILE]
        : [WORKER_MAIN_FILE],
      {
        env: process.env,
        stdio: 'inherit',
      },
    )

    debug.info(`Spawned worker [${worker.pid}]`)

    workersSet.add(worker)
    worker.once('exit', () => {
      debug.info(`Worker died [${worker.pid}]`)
      workersSet.delete(worker)
      spawnWorker()
    })
  }

  // Start the workers needed for metadata processing
  for (let i = 0; i < WORKERS_NUMBER; i++) {
    spawnWorker()
  }

  // Bind the dealer socket
  await new Promise((resolve, reject) => {
    dealer.bind(SOCKET_ADDRESS, (error) => {
      if (error) {
        reject(new Error(error))
      } else {
        debug.info(`ZMQ Dealer bound to ${SOCKET_ADDRESS}`)
        resolve()
      }
    })
  })

  // Give half second to the workers to connect their routers
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    processMediaFile: (file, timeout) =>
      new Promise(async (resolve) => {
        const requestId = requestsQueue.add(file)

        const timeoutHandle =
          timeout && timeout > 0
            ? setTimeout(() => {
                subscription.unsubscribe()
                resolve(left('TIMEOUT'))
              }, timeout)
            : null

        const subscription = responsesStream
          .pipe(filter(({ id }) => id === requestId))
          .subscribe((response) => {
            if (timeoutHandle !== null) {
              clearTimeout(timeoutHandle)
            }
            subscription.unsubscribe()
            resolve(response.result)
          })
      }),
    stop: () => {
      workersSet.forEach((worker) => {
        debug.info(`Killing worker [${worker.pid}]`)
        worker.kill()
      })
    },
  }
}

type StoppablePort = CombineObjects<
  MediaFileMetadataProcessingPort,
  {
    stop: () => void
  }
>
