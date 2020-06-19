/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { body, endpoint, request, response } from '@airtasker/spot'

import { PersistencyFailureResponse } from '../error-responses'
import { Artist } from './entities'

/**
 * Get all Artists
 */
@endpoint({
  method: 'GET',
  path: '/browse/artists',
  tags: ['browsing'],
})
export class GetAllArtists {
  @request
  request() {}

  /**
   * Success
   */
  @response({ status: 200 })
  success(@body body: GetAllArtistsSuccessResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface GetAllArtistsSuccessResponse {
  success: true
  artists: Artist[]
}
