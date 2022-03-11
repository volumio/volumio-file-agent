/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { endpoint, request, response } from '@airtasker/spot'

/**
 * Actually simply responds with a 204 status code.
 *
 * Could be used later by consumers to check if service status is good.
 */
@endpoint({
  method: 'GET',
  path: '/healthz',
})
export class HealthCheck {
  @request
  request() {}

  @response({ status: 204 })
  success() {}
}
