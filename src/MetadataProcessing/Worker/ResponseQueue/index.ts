import { queue } from 'async'
import * as zmq from 'zeromq'

import { JobResult } from '../JobQueue'
import { ResponseDispatcher } from './ResponseDispatcher'

export const ResponseQueue = (router: zmq.Router): ResponseQueue => {
  const dispatcher = ResponseDispatcher(router)
  const sendQueue = queue(
    dispatcher,
    /**
     * Concurrency is set to 1
     * because we have to wait
     * the router to be ready
     */
    1,
  )

  return {
    add: (result) => sendQueue.push(result),
  }
}

export type ResponseQueue = {
  add: (result: JobResult) => void
}
