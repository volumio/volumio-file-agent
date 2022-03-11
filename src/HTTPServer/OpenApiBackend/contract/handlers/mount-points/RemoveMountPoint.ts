import { AgentInterface } from '@Agent'
import { isLeft } from 'fp-ts/lib/Either'

import { PersistencyFailureResponse } from '../../endpoints/error-responses'
import {
  RemoveMountPointRequestBody,
  RemoveMountPointSuccessResponse,
} from '../../endpoints/mount-points/remove-mount-point'
import { Handler, ResponseDescription } from '../types'

export const RemoveMountPoint = ({
  agent,
}: Dependencies): Handler<
  {},
  {},
  RemoveMountPointRequestBody,
  SuccessOutput | ServerErrorOutput
> => async (_, req) => {
  const { path } = req.body

  const removeResult = await agent.command.removeMountPoint(path)

  if (isLeft(removeResult)) {
    switch (removeResult.left) {
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
    },
  }
}

type SuccessOutput = ResponseDescription<200, RemoveMountPointSuccessResponse>
type ServerErrorOutput = ResponseDescription<500, PersistencyFailureResponse>

type Dependencies = {
  agent: AgentInterface
}
