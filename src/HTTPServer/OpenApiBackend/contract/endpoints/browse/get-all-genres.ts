/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { body, endpoint, request, response } from '@airtasker/spot'

import { PersistencyFailureResponse } from '../error-responses'
import { Genre } from './entities'

/**
 * Get all Genres
 */
@endpoint({
  method: 'GET',
  path: '/browse/genres',
  tags: ['browsing'],
})
export class GetAllGenres {
  @request
  request() {}

  /**
   * Success
   */
  @response({ status: 200 })
  success(@body body: GetAllGenresSuccessResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface GetAllGenresSuccessResponse {
  success: true

  /**
   * Genres are retured in alphabetical order
   */
  genres: Genre[]
}
