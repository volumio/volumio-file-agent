import 'core-js/modules/es.symbol.async-iterator'

import * as zmq from 'zeromq'

import { SOCKET_ADDRESS } from '../constants'
import { JobQueue } from './JobQueue'
import { ResponseQueue } from './ResponseQueue'

async function processRequests(router: zmq.Router) {
  const jobQueue = JobQueue()
  const responseQueue = ResponseQueue(router)

  while (!router.closed) {
    const [requester, jobId, serializedFile] = await router.receive()

    /**
     * We do not await this process
     * because we want to be able to receive a new request immediately.
     *
     * Concurrency handling is managed by the job queue.
     */
    jobQueue
      .process({
        requester,
        id: jobId,
        file: JSON.parse(serializedFile.toString()),
      })
      .then((result) => responseQueue.add(result))
  }
}

async function main() {
  const router = new zmq.Router()
  router.connect(SOCKET_ADDRESS)
  console.log(`MetadataProcessing worker [${process.pid}]: router connected`)

  processRequests(router)

  process.once('exit', () => {
    router.close()
    router.disconnect(SOCKET_ADDRESS)
  })
}

main()
