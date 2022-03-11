import { AgentInterface } from '@Agent'
import { isLeft } from 'fp-ts/lib/Either'

import { GetAllComposersSuccessResponse } from '../../endpoints/browsing/get-all-composers'
import { PersistencyFailureResponse } from '../../endpoints/error-responses'
import { Handler, ResponseDescription } from '../types'

export const GetAllComposers = ({
  agent,
}: Dependencies): Handler<
  {},
  {},
  {},
  SuccessOutput | ServerErrorOutput
> => async () => {
  const allComposersNamesResult = await agent.query.allComposersNames()

  if (isLeft(allComposersNamesResult)) {
    switch (allComposersNamesResult.left) {
      case 'PERSISTENCY_FAILURE':
        return {
          status: 500,
          body: {
            success: false,
            error: {
              message: 'PERSISTENCY_FAILURE',
            },
          },
        }
    }
  }

  return {
    status: 200,
    body: {
      success: true,
      composers: allComposersNamesResult.right.sort(),
    },
  }
}

type SuccessOutput = ResponseDescription<200, GetAllComposersSuccessResponse>
type ServerErrorOutput = ResponseDescription<500, PersistencyFailureResponse>

type Dependencies = {
  agent: AgentInterface
}
