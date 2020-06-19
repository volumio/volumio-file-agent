/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { body, endpoint, pathParams, request, response } from '@airtasker/spot'

import { PersistencyFailureResponse } from '../error-responses'
import { Album, Composer, Track } from './entities'

/**
 * Get one Composer
 */
@endpoint({
  method: 'GET',
  path: '/browse/composers/:name',
  tags: ['browsing'],
})
export class GetComposer {
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
  success(@body body: GetComposerSuccessResponse) {}

  /**
   * The Composer was not found
   */
  @response({ status: 404 })
  notFound(@body body: GetComposerNotFoundResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface GetComposerReturnedComposer extends Composer {
  albums: Album[]
  tracks: Track[]
}

export interface GetComposerSuccessResponse {
  success: true
  composer: GetComposerReturnedComposer
}

export interface GetComposerNotFoundResponse {
  success: false
  error: {
    message: 'COMPOSER_NOT_FOUND'
  }
}
