import { Agent } from '@Agent'
import { isLeft } from 'fp-ts/lib/Either'

import { GetAllMountPointsSuccessResponse } from '../endpoints/get-all-mount-points'
import { ServerErrorResponse } from '../endpoints/server-error-response'
import { Handler, ResponseDescription } from './types'

export const GetAllMountPoints = ({
  agent,
}: Dependencies): Handler<
  {},
  {},
  {},
  SuccessOutput | ServerErrorOutput
> => async () => {
  const mountPointsWithStatsResult = await agent.getAllMountPointsWithStats()

  if (isLeft(mountPointsWithStatsResult)) {
    switch (mountPointsWithStatsResult.left) {
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

  const { right: mountPoints } = mountPointsWithStatsResult

  return {
    status: 200,
    body: {
      success: true,
      mountPoints,
    },
  }
}

type SuccessOutput = ResponseDescription<200, GetAllMountPointsSuccessResponse>
type ServerErrorOutput = ResponseDescription<500, ServerErrorResponse>

type Dependencies = {
  agent: Agent
}
