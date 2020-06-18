/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { body, endpoint, request, response } from '@airtasker/spot'

import { PersistencyFailureResponse } from '../error-responses'
import { Album, Artist } from './entities'

/**
 * Get all Albums
 */
@endpoint({
  method: 'GET',
  path: '/browse/albums',
  tags: ['browsing'],
})
export class GetAllAlbums {
  @request
  request() {}

  /**
   * Success
   */
  @response({ status: 200 })
  success(@body body: GetAllAlbumsSuccessResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface GetAllAlbumsReturnedAlbum extends Album {
  artist: Artist
  albumArtist?: Artist
}

export interface GetAllAlbumsSuccessResponse {
  success: true
  albums: GetAllAlbumsReturnedAlbum[]
}
