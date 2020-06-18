/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { body, endpoint, request, response } from '@airtasker/spot'

import {
  PersistencyFailureResponse,
  ValidationErrorResponse,
} from './error-responses'

/**
 * Remove a MountPoint from the Agent knowledge
 */
@endpoint({
  method: 'DELETE',
  path: '/mount-points',
  tags: ['mount-points'],
})
export class RemoveMountPoint {
  @request
  request(
    @body
    body: RemoveMountPointRequestBody,
  ) {}

  /**
   * Success
   */
  @response({ status: 200 })
  success(@body body: RemoveMountPointSuccessResponse) {}

  /**
   * Bad request
   */
  @response({ status: 400 })
  badRequest(@body body: ValidationErrorResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export type RemoveMountPointRequestBody = {
  path: string
}

export type RemoveMountPointSuccessResponse = {
  success: true
}
