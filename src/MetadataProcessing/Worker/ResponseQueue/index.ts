import { isLeft } from 'fp-ts/lib/Either'
import * as zmq from 'zeromq'

import { JobResult } from '../JobQueue'

export const ResponseQueue = (router: zmq.Socket): ResponseQueue => {
  return {
    add: (result) => {
      const response = isLeft(result)
        ? [
            result.left.requester,
            result.left.id,
            'ERROR',
            JSON.stringify({
              name: result.left.error.name,
              message: result.left.error.message,
              stack: result.left.error.stack,
            }),
          ]
        : [
            result.right.requester,
            result.right.id,
            'OK',
            JSON.stringify(result.right.file),
          ]

      router.send(response)
    },
  }
}

export type ResponseQueue = {
  add: (result: JobResult) => void
}
