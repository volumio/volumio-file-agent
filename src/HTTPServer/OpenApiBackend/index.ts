import { Agent } from '@Agent'
import { Request } from 'express'
import OpenAPIBackend, { Context, Document } from 'openapi-backend'
import { CombineObjects, Overwrite, OverwriteReturn } from 'simplytyped'

import { AddMountPoint } from './handlers/AddMountPoint'
import { GetAllMountPoints } from './handlers/GetAllMountPoints'
import { HealthCheck } from './handlers/HealthCheck'
import {
  Handler,
  ParamsDictionary,
  QueryDictionary,
  ResponseDescription,
} from './handlers/types'
import openApiSpec from './spec.json'

export { OpenApiBackendMiddleware } from './middleware'

export const buildOpenApiBackend = async ({ agent }: Dependencies) => {
  const handlers = {
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
  }

  type Handlers = typeof handlers
  type HandleRequestResult = ReturnType<Handlers[keyof Handlers]>

  const api = new OpenAPIBackend({
    definition: {
      openapi: openApiSpec.openapi,
      info: openApiSpec.info,
      paths: (openApiSpec.paths as unknown) as Document['paths'],
      components: (openApiSpec.components as unknown) as Document['components'],
    },
    strict: true,
    handlers,
  })

  await api.init()

  return api as Overwrite<
    OpenAPIBackend,
    {
      handleRequest: OverwriteReturn<
        OpenAPIBackend['handleRequest'],
        HandleRequestResult
      >
    }
  >
}

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

export type Backend = PromisedBy<ReturnType<typeof buildOpenApiBackend>>

type PromisedBy<T> = T extends Promise<infer V> ? V : never

type Dependencies = {
  agent: Agent
}
