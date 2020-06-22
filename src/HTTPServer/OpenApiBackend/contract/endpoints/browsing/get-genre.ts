/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { body, endpoint, pathParams, request, response } from '@airtasker/spot'

import { PersistencyFailureResponse } from '../error-responses'
import { Album } from './entities'

/**
 * Get one Genre
 */
@endpoint({
  method: 'GET',
  path: '/browse/genres/:name',
  tags: ['browsing'],
})
export class GetGenre {
  @request
  request(
    @pathParams
    pathParams: {
      name: string
    },
  ) {}

  /**
   * Success
   */
  @response({ status: 200 })
  success(@body body: GetGenreSuccessResponse) {}

  /**
   * The Genre was not found
   */
  @response({ status: 404 })
  notFound(@body body: GetGenreNotFoundResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface GetGenreReturnedGenre {
  name: string
  artists: string[]
  albums: Album[]
}

export interface GetGenreSuccessResponse {
  success: true
  genre: GetGenreReturnedGenre
}

export interface GetGenreNotFoundResponse {
  success: false
  error: {
    message: 'GENRE_NOT_FOUND'
  }
}
