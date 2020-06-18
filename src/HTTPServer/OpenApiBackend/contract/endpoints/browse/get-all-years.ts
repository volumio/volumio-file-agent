/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { body, endpoint, request, response } from '@airtasker/spot'

import { PersistencyFailureResponse } from '../error-responses'

/**
 * Get all years
 */
@endpoint({
  method: 'GET',
  path: '/browse/years',
  tags: ['browsing'],
})
export class GetAllYears {
  @request
  request() {}

  /**
   * Success
   */
  @response({ status: 200 })
  success(@body body: GetAllYearsSuccessResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface GetAllYearsSuccessResponse {
  success: true
  years: number[]
}
