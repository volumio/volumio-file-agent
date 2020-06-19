/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { body, endpoint, request, response } from '@airtasker/spot'

import { PersistencyFailureResponse } from '../error-responses'
import { Composer } from './entities'

/**
 * Get all Composers
 */
@endpoint({
  method: 'GET',
  path: '/browse/composers',
  tags: ['browsing'],
})
export class GetAllComposers {
  @request
  request() {}

  /**
   * Success
   */
  @response({ status: 200 })
  success(@body body: GetAllComposersSuccessResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface GetAllComposersSuccessResponse {
  success: true
  composers: Composer[]
}
