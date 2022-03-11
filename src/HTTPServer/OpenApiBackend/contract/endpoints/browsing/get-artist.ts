/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { body, endpoint, pathParams, request, response } from '@airtasker/spot'

import { PersistencyFailureResponse } from '../error-responses'
import { Album, Track } from './entities'

/**
 * Get one Artists
 */
@endpoint({
  method: 'GET',
  path: '/browse/artists/:name',
  tags: ['browsing'],
})
export class GetArtist {
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
  success(@body body: GetArtistSuccessResponse) {}

  /**
   * The Artist was not found
   */
  @response({ status: 404 })
  notFound(@body body: GetArtistNotFoundResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface GetArtistReturnedArtist {
  name: string
  albums: Album[]
  tracks: Track[]
}

export interface GetArtistSuccessResponse {
  success: true
  artist: GetArtistReturnedArtist
}

export interface GetArtistNotFoundResponse {
  success: false
  error: {
    message: 'ARTIST_NOT_FOUND'
  }
}
