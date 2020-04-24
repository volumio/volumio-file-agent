import { Agent } from '@Agent'
import { Request } from 'express'
import { Context } from 'openapi-backend'
import { CombineObjects } from 'simplytyped'

import { AddMountPoint } from './AddMountPoint'
import { GetAllMountPoints } from './GetAllMountPoints'
import { HealthCheck } from './HealthCheck'
import {
  Handler,
  ParamsDictionary,
  QueryDictionary,
  ResponseDescription,
} from './types'

type Handlers = ReturnType<typeof Handlers>

export type HandlerOutcome = ReturnType<Handlers[keyof Handlers]>

export const Handlers = ({ agent }: Dependencies) => ({
  AddMountPoint: wrapResponse(AddMountPoint({ agent })),
  GetAllMountPoints: wrapResponse(GetAllMountPoints({ agent })),
  HealthCheck: wrapResponse(HealthCheck({ agent })),
  notFound: async () => ({
    type: 'not-found' as const,
  }),
  notImplemented: async () => ({
    type: 'not-implemented' as const,
  }),
  validationFail: async (c: Context) => ({
    type: 'validation-failure' as const,
    validation: c.validation,
  }),
})

const wrapResponse = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Output extends ResponseDescription<number, any>,
  Fn extends Handler<
    ParamsDictionary,
    QueryDictionary,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    Output
  >
>(
  fn: Fn,
) => async (
  c: Context,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: Request<ParamsDictionary, any, any, QueryDictionary>,
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

type Dependencies = {
  agent: Agent
}
