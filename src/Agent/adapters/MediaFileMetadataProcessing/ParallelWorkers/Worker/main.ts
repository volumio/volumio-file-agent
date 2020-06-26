import 'core-js/modules/es.symbol.async-iterator'

import * as zmq from 'zeromq'

import { init as initHeapDump } from '../../../../../HeapDump'
import { SOCKET_ADDRESS } from '../constants'
import { debug } from './debug'
import { ExecutionQueue } from './ExecutionQueue'
import { ResponseQueue } from './ResponseQueue'

async function main() {
  const router = zmq.socket('router')
  router.connect(SOCKET_ADDRESS)
  debug.info(`ZMQ Router connected to ${SOCKET_ADDRESS}`)

  const executionQueue = ExecutionQueue()
  const responseQueue = ResponseQueue(router)

  const processRequest = async (...request: Buffer[]) => {
    const [requester, jobId, serializedFile] = request
    const result = await executionQueue.add({
      id: jobId,
      requester,
      file: JSON.parse(serializedFile.toString()),
    })
    responseQueue.add(result)
  }

  router.on('message', processRequest)
  router.on('close', () => {
    router.removeListener('message', processRequest)
  })

  process.once('exit', () => {
    router.close()
    router.disconnect(SOCKET_ADDRESS)
  })

  if (process.env.WITH_HEAPDUMP === 'true') {
    initHeapDump({
      directory: process.cwd(),
      tickInterval: 5000,
      filePrefix: `.worker-${process.pid}`,
    })
  }
}

main()
