import 'core-js/modules/es.symbol.async-iterator'

import * as zmq from 'zeromq'

import { SOCKET_ADDRESS } from '../constants'
import { debug } from './debug'
import { JobQueue } from './JobQueue'
import { ResponseQueue } from './ResponseQueue'

async function main() {
  const router = zmq.socket('router')
  router.connect(SOCKET_ADDRESS)
  debug.info(`ZMQ Router connected to ${SOCKET_ADDRESS}`)

  const jobQueue = JobQueue()
  const responseQueue = ResponseQueue(router)

  const enqueueRequest = (...request: Buffer[]) => {
    const [requester, jobId, serializedFile] = request
    jobQueue
      .process({
        requester,
        id: jobId,
        file: JSON.parse(serializedFile.toString()),
      })
      .then((result) => responseQueue.add(result))
  }

  router.on('message', enqueueRequest)
  router.on('close', () => {
    router.removeListener('message', enqueueRequest)
  })

  process.once('exit', () => {
    router.close()
    router.disconnect(SOCKET_ADDRESS)
  })
}

main()
