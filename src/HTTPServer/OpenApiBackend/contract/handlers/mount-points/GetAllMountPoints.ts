import { AgentInterface } from '@Agent'
import { isLeft } from 'fp-ts/lib/Either'

import { PersistencyFailureResponse } from '../../endpoints/error-responses'
import { GetAllMountPointsSuccessResponse } from '../../endpoints/mount-points/get-all-mount-points'
import { Handler, ResponseDescription } from '../types'

export const GetAllMountPoints = ({
  agent,
}: Dependencies): Handler<
  {},
  {},
  {},
  SuccessOutput | ServerErrorOutput
> => async () => {
  const mountPointsWithStatsResult = await agent.query.allMountPoints()

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

  return {
    status: 200,
    body: {
      success: true,
      mountPoints: mountPointsWithStatsResult.right,
    },
  }
}

type SuccessOutput = ResponseDescription<200, GetAllMountPointsSuccessResponse>
type ServerErrorOutput = ResponseDescription<500, PersistencyFailureResponse>

type Dependencies = {
  agent: AgentInterface
}
