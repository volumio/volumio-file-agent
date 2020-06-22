import { AgentInterface } from '@Agent'
import { isLeft } from 'fp-ts/lib/Either'

import { GetAllArtistsSuccessResponse } from '../../endpoints/browsing/get-all-artists'
import { PersistencyFailureResponse } from '../../endpoints/error-responses'
import { Handler, ResponseDescription } from '../types'

export const GetAllArtists = ({
  agent,
}: Dependencies): Handler<
  {},
  {},
  {},
  SuccessOutput | ServerErrorOutput
> => async () => {
  const allArtistsNamesResult = await agent.query.allArtistsNames()

  if (isLeft(allArtistsNamesResult)) {
    switch (allArtistsNamesResult.left) {
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
      artists: allArtistsNamesResult.right.sort(),
    },
  }
}

type SuccessOutput = ResponseDescription<200, GetAllArtistsSuccessResponse>
type ServerErrorOutput = ResponseDescription<500, PersistencyFailureResponse>

type Dependencies = {
  agent: AgentInterface
}
