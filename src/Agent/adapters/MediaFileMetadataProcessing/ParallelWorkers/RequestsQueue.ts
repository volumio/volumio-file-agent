import { queue } from 'async'
import { generate as RequestId } from 'shortid'
import * as zmq from 'zeromq'

import { JobToExecute } from './Worker/types'

export const RequestsQueue = (dealer: zmq.Socket): RequestsQueue => {
  const requestQueue = queue<{
    id: string
    serializedFile: string
  }>((request, done) => {
    dealer.send([request.id, request.serializedFile])
    done()
  })

  return {
    add: (file) => {
      const requestId = RequestId()
      requestQueue.push({
        id: requestId,
        serializedFile: JSON.stringify(file),
      })
      return requestId
    },
  }
}

export type RequestsQueue = {
  /**
   * Enqueue a new processing request
   * returning the request ID
   */
  add: (file: JobToExecute['file']) => string
}
