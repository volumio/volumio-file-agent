import { Either, left, right } from 'fp-ts/lib/Either'
import { Observable, Subject } from 'rxjs'
import * as zmq from 'zeromq'

import { JobSuccess } from './Worker/types'

async function processMessages(dealer: zmq.Dealer, subject: Subject<Response>) {
  while (!dealer.closed) {
    const [requestId, outcome, serializedErrorOrFile] = await dealer.receive()

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
}

export const ResponseStream = (dealer: zmq.Dealer): Observable<Response> => {
  const subject = new Subject<Response>()
  processMessages(dealer, subject)
  return subject
}

export type Response = {
  id: string
  result: Either<Error, JobSuccess['file']>
}
