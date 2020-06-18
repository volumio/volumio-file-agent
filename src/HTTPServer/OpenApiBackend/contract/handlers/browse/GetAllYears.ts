import { AgentInterface } from '@Agent'
import { isLeft } from 'fp-ts/lib/Either'

import { GetAllYearsSuccessResponse } from '../endpoints/browse/get-all-years'
import { PersistencyFailureResponse } from '../endpoints/error-responses/PersisistencyFailureResponse'
import { Handler, ResponseDescription } from './types'
export const GetAllYears = ({
  agent,
}: Dependencies): Handler<
  {},
  {},
  {},
  SuccessOutput | PersistencyFailureOutput
> => async () => {
  const allYearsResult = await agent.getAllYears()

  if (isLeft(allYearsResult)) {
    switch (allYearsResult.left) {
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
      years: allYearsResult.right.sort(),
    },
  }
}

type SuccessOutput = ResponseDescription<200, GetAllYearsSuccessResponse>

type PersistencyFailureOutput = ResponseDescription<
  500,
  PersistencyFailureResponse
>

type Dependencies = {
  agent: AgentInterface
}
