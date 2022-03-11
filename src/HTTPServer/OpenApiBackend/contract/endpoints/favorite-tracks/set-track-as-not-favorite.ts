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
 * Set a Track as NOT favorite
 */
@endpoint({
  method: 'DELETE',
  path: '/favorite-tracks',
  tags: ['favorite-tracks'],
})
export class SetTrackAsNotFavorite {
  @request
  request(
    @body
    body: SetTrackAsNotFavoriteRequestBody,
  ) {}

  /**
   * Success
   */
  @response({ status: 200 })
  success(@body body: SetTrackAsNotFavoriteSuccessResponse) {}

  /**
   * Bad request
   */
  @response({ status: 400 })
  badRequest(@body body: ValidationErrorResponse) {}

  /**
   * The track does not exist
   */
  @response({ status: 404 })
  notFound(@body body: SetTrackAsNotFavoriteNotFoundResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface SetTrackAsNotFavoriteRequestBody {
  track: {
    file: {
      path: string
    }
  }
}

export interface SetTrackAsNotFavoriteSuccessResponse {
  success: true
  track: Track
}

export interface SetTrackAsNotFavoriteNotFoundResponse {
  success: false
  error: {
    message: 'TRACK_NOT_FOUND'
  }
}
