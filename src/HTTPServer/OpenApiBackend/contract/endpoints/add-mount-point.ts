/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { body, endpoint, request, response } from '@airtasker/spot'

import {
  PersistencyFailureResponse,
  ValidationErrorResponse,
} from './error-responses'

/**
 * Add a MountPoint to the agent knowledge
 */
@endpoint({
  method: 'POST',
  path: '/mount-points',
  tags: ['mount-points'],
})
export class AddMountPoint {
  @request
  request(
    @body
    body: AddMountPointRequestBody,
  ) {}

  /**
   * Success
   */
  @response({ status: 201 })
  success(@body body: AddMountPointSuccessResponse) {}

  /**
   * Bad request
   */
  @response({ status: 400 })
  badRequest(
    @body body: AddMountPointBadRequestResponse | ValidationErrorResponse,
  ) {}

  /**
   * Either MountPoint does not exist or is not a folder
   */
  @response({ status: 404 })
  notFound(@body body: AddMountPointNotFoundResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface AddMountPointRequestBody {
  path: string
}

export interface AddMountPointSuccessResponse {
  success: true
}

export interface AddMountPointBadRequestResponse {
  success: false
  error: {
    message:
      | 'DEEPER_MOUNT_POINT_ALREADY_ADDED'
      | 'MOUNT_POINT_ALREADY_CONTAINED_IN_OTHER_MOUNT_POINT'
      | 'MOUNT_POINT_CANNOT_BE_FILESYSTEM_ROOT'
      | 'MOUNT_POINT_MUST_BE_ABSOLUTE'
  }
}

export interface AddMountPointNotFoundResponse {
  success: false
  error: {
    message: 'MOUNT_POINT_MUST_BE_A_FOLDER' | 'MOUNT_POINT_DOES_NOT_EXIST'
  }
}
