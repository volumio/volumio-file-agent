import { Agent } from '@Agent'
import { isLeft } from 'fp-ts/lib/Either'

import {
  AddMountPointBadRequestResponse,
  AddMountPointNotFoundResponse,
  AddMountPointRequestBody,
  AddMountPointSuccessResponse,
} from '../endpoints/add-mount-point'
import { ServerErrorResponse } from '../endpoints/server-error-response'
import { Handler, ResponseDescription } from './types'

export const AddMountPoint = ({
  agent,
}: Dependencies): Handler<
  {},
  {},
  AddMountPointRequestBody,
  SuccessOutput | NotFoundOutput | BadRequestOutput | ServerErrorOutput
> => async (_, req) => {
  const { path } = req.body

  const jobCreationResult = await agent.addMountPoint(path)

  if (isLeft(jobCreationResult)) {
    switch (jobCreationResult.left) {
      case 'DEEPER_MOUNT_POINT_ALREADY_ADDED':
      case 'MOUNT_POINT_ALREADY_CONTAINED_IN_OTHER_MOUNT_POINT':
      case 'MOUNT_POINT_CANNOT_BE_FILESYSTEM_ROOT':
      case 'MOUNT_POINT_MUST_BE_ABSOLUTE':
        return {
          status: 400,
          body: {
            success: false,
            error: {
              message: jobCreationResult.left,
            },
          },
        }
      case 'MOUNT_POINT_MUST_BE_A_FOLDER':
      case 'MOUNT_POINT_DOES_NOT_EXIST':
        return {
          status: 404,
          body: {
            success: false,
            error: {
              message: jobCreationResult.left,
            },
          },
        }
      case 'PERSISTENCY_FAILURE':
        return {
          status: 500,
          body: {
            success: false,
            error: {
              message: jobCreationResult.left,
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

type SuccessOutput = ResponseDescription<200, AddMountPointSuccessResponse>
type NotFoundOutput = ResponseDescription<404, AddMountPointNotFoundResponse>
type BadRequestOutput = ResponseDescription<
  400,
  AddMountPointBadRequestResponse
>
type ServerErrorOutput = ResponseDescription<500, ServerErrorResponse>

type Dependencies = {
  agent: Agent
}
