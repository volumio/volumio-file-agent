/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import {
  body,
  endpoint,
  Integer,
  pathParams,
  request,
  response,
} from '@airtasker/spot'

import { PersistencyFailureResponse } from '../error-responses'
import { Album } from './entities'

/**
 * Get one year
 */
@endpoint({
  method: 'GET',
  path: '/browse/years/:num',
  tags: ['browsing'],
})
export class GetYear {
  @request
  request(
    @pathParams
    pathParams: {
      num: Integer
    },
  ) {}

  /**
   * Success
   */
  @response({ status: 200 })
  success(@body body: GetYearSuccessResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface GetYearSuccessResponse {
  success: true
  year: {
    number: number
    albums: Album[]
  }
}
