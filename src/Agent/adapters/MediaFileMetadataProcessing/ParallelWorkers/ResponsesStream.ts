import { Either, left, right } from 'fp-ts/lib/Either'
import { Observable, Subject } from 'rxjs'
import * as zmq from 'zeromq'

import { SuccessfulJob } from './Worker/types'

export const ResponsesStream = (dealer: zmq.Socket): Observable<Response> => {
  const subject = new Subject<Response>()

  const streamResponse = (...parts: Buffer[]) => {
    const [requestId, outcome, serializedErrorOrFile] = parts

    try {
      const errorOrFile = JSON.parse(serializedErrorOrFile.toString())
      subject.next({
        id: requestId.toString(),
        result:
          outcome.toString() === 'OK' ? right(errorOrFile) : left(errorOrFile),
      })
    } catch (error) {
      subject.next({
        id: requestId.toString(),
        result: left(error),
      })
    }
  }

  dealer.on('message', streamResponse)
  dealer.once('close', () => {
    dealer.removeListener('message', streamResponse)
  })

  return subject
}

export type Response = {
  id: string
  result: Either<Error, SuccessfulJob['file']>
}
