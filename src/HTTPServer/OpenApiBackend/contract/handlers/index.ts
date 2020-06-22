import { AgentInterface } from '@Agent'
import { Context } from 'openapi-backend'

import { BrowsingHandlers } from './browsing'
import { HealthCheck } from './HealthCheck'
import { MountPointsHandlers } from './mount-points'
import { wrapResponse } from './utils'

export const Handlers = ({ agent }: Dependencies) => {
  const browsingHandlers = BrowsingHandlers({ agent })
  const mountPointsHandlers = MountPointsHandlers({ agent })

  return {
    ...browsingHandlers,
    ...mountPointsHandlers,
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
}

type Dependencies = {
  agent: AgentInterface
}

type Handlers = ReturnType<typeof Handlers>

export type HandlerOutcome = ReturnType<Handlers[keyof Handlers]>
