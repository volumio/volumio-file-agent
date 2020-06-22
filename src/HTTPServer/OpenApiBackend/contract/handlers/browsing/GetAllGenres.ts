import { AgentInterface } from '@Agent'
import { isLeft } from 'fp-ts/lib/Either'

import { GetAllGenresSuccessResponse } from '../../endpoints/browsing/get-all-genres'
import { PersistencyFailureResponse } from '../../endpoints/error-responses/PersisistencyFailureResponse'
import { Handler, ResponseDescription } from '../types'
export const GetAllGenres = ({
  agent,
}: Dependencies): Handler<
  {},
  {},
  {},
  SuccessOutput | PersistencyFailureOutput
> => async () => {
  const allGenresNamesResult = await agent.query.allGenresNames()

  if (isLeft(allGenresNamesResult)) {
    switch (allGenresNamesResult.left) {
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
      genres: allGenresNamesResult.right.sort(),
    },
  }
}

type SuccessOutput = ResponseDescription<200, GetAllGenresSuccessResponse>

type PersistencyFailureOutput = ResponseDescription<
  500,
  PersistencyFailureResponse
>

type Dependencies = {
  agent: AgentInterface
}
