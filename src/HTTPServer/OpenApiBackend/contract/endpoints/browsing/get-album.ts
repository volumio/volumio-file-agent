/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { body, endpoint, queryParams, request, response } from '@airtasker/spot'

import { PersistencyFailureResponse } from '../error-responses'
import { Album, Artist, Track } from './entities'

/**
 * Get one Album
 */
@endpoint({
  method: 'GET',
  path: '/browse/album',
  tags: ['browsing'],
})
export class GetAlbum {
  @request
  request(
    @queryParams
    queryParams: {
      artistName: string
      title: string
    },
  ) {}

  /**
   * Success
   */
  @response({ status: 200 })
  success(@body body: GetAlbumSuccessResponse) {}

  /**
   * The album was not found
   */
  @response({ status: 404 })
  notFound(@body body: GetAlbumNotFoundResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface GetAlbumReturnedAlbum extends Album {
  artist: Artist
  albumArtist?: Artist
  tracks: Track
}

export interface GetAlbumSuccessResponse {
  success: true
  album: GetAlbumReturnedAlbum
}

export interface GetAlbumNotFoundResponse {
  success: false
  error: {
    message: 'ALBUM_NOT_FOUND'
  }
}
