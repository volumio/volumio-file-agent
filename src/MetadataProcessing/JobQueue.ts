import { queue } from 'async'
import { generate as RequestId } from 'shortid'
import * as zmq from 'zeromq'

import { Job } from './Worker/types'

export const JobQueue = (dealer: zmq.Dealer): JobQueue => {
  const requestQueue = queue<{
    id: string
    serializedFile: string
  }>(
    (request, done) => {
      if (!dealer.closed) {
        dealer
          .send([request.id, request.serializedFile])
          .then(() => done())
          .catch((error) => {
            console.error(error)
            done(error)
          })
      } else {
        done()
      }
    },
    /**
     * Concurrency is set to 1
     * because we have to wait
     * the dealer to be ready to send
     */
    1,
  )

  return {
    enqueue: (file) => {
      const requestId = RequestId()
      requestQueue.push({
        id: requestId,
        serializedFile: JSON.stringify(file),
      })
      return requestId
    },
  }
}

export type JobQueue = {
  enqueue: (file: Job['file']) => string
}
