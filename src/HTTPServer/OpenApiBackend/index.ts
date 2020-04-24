import { Agent } from '@Agent'
import OpenAPIBackend, { Document } from 'openapi-backend'
import { Overwrite, OverwriteReturn } from 'simplytyped'

import openApiContract from './contract.json'
import { HandlerOutcome, Handlers } from './contract/handlers'

export { OpenApiBackendMiddleware } from './middleware'

export const buildOpenApiBackend = async ({
  agent,
}: Dependencies): Promise<Backend> => {
  const api = new OpenAPIBackend({
    definition: {
      openapi: openApiContract.openapi,
      info: openApiContract.info,
      paths: (openApiContract.paths as unknown) as Document['paths'],
      components: (openApiContract.components as unknown) as Document['components'],
    },
    strict: true,
    handlers: Handlers({ agent }),
  })

  await api.init()

  return api
}

export type Backend = Overwrite<
  OpenAPIBackend,
  {
    handleRequest: OverwriteReturn<
      OpenAPIBackend['handleRequest'],
      HandlerOutcome
    >
  }
>
type Dependencies = {
  agent: Agent
}
