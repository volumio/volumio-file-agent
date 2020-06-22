import { AgentInterface } from '@Agent'

import { Handler, ResponseDescription } from './types'

export const HealthCheck = ({}: Dependencies): Handler<
  {},
  {},
  {},
  SuccessOutput
> => async () => {
  return {
    status: 204,
    body: undefined,
  }
}

type SuccessOutput = ResponseDescription<204, void>

type Dependencies = {
  agent: AgentInterface
}
