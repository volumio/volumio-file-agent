/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from 'express'
import { Context } from 'openapi-backend'
import { CombineObjects } from 'simplytyped'

import { Handler, ResponseDescription } from './types'

export const wrapResponse = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Output extends ResponseDescription<number, any>,
  Params extends {},
  Query extends {}
>(
  fn: Handler<
    Params,
    Query,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    Output
  >,
) => async (
  c: Context,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: Request<Params, any, any, Query>,
): Promise<
  CombineObjects<
    Output,
    {
      type: 'response'
    }
  >
> => {
  const response = await fn(c, request)
  return {
    ...response,
    type: 'response',
  }
}
