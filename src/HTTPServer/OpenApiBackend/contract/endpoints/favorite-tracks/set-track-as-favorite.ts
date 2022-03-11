/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { body, endpoint, request, response } from '@airtasker/spot'

import { Track } from '../browsing/entities/Track'
import {
  PersistencyFailureResponse,
  ValidationErrorResponse,
} from '../error-responses'

/**
 * Set a Track as favorite
 */
@endpoint({
  method: 'POST',
  path: '/favorite-tracks',
  tags: ['favorite-tracks'],
})
export class SetTrackAsFavorite {
  @request
  request(
    @body
    body: SetTrackAsFavoriteRequestBody,
  ) {}

  /**
   * Success
   */
  @response({ status: 200 })
  success(@body body: SetTrackAsFavoriteSuccessResponse) {}

  /**
   * Bad request
   */
  @response({ status: 400 })
  badRequest(@body body: ValidationErrorResponse) {}

  /**
   * The track does not exist
   */
  @response({ status: 404 })
  notFound(@body body: SetTrackAsFavoriteNotFoundResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface SetTrackAsFavoriteRequestBody {
  track: {
    file: {
      path: string
    }
  }
}

export interface SetTrackAsFavoriteSuccessResponse {
  success: true
  track: Track
}

export interface SetTrackAsFavoriteNotFoundResponse {
  success: false
  error: {
    message: 'TRACK_NOT_FOUND'
  }
}
