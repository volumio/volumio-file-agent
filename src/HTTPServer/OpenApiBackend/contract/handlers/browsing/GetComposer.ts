import { AgentInterface } from '@Agent'
import { isLeft } from 'fp-ts/lib/Either'

import {
  GetComposerNotFoundResponse,
  GetComposerSuccessResponse,
} from '../../endpoints/browsing/get-composer'
import { PersistencyFailureResponse } from '../../endpoints/error-responses'
import { Handler, ResponseDescription } from '../types'

export const GetComposer = ({
  agent,
}: Dependencies): Handler<
  { name: string },
  {},
  {},
  SuccessOutput | NotFoundOutput | ServerErrorOutput
> => async (_, request) => {
  const allTracksByComposerResult = await agent.query.allTracksByComposer({
    name: request.params.name,
  })

  if (isLeft(allTracksByComposerResult)) {
    switch (allTracksByComposerResult.left) {
      case 'PERSISTENCY_FAILURE':
        return {
          status: 500,
          body: {
            success: false,
            error: {
              message: 'PERSISTENCY_FAILURE',
            },
          },
        }
    }
  }

  const tracks = allTracksByComposerResult.right

  if (tracks.length === 0) {
    return {
      status: 404,
      body: {
        success: false,
        error: {
          message: 'COMPOSER_NOT_FOUND',
        },
      },
    }
  }

  return {
    status: 200,
    body: {
      success: true,
      composer: {
        name: request.params.name,
        albums: [],
        tracks: [],
      },
    },
  }
}

type SuccessOutput = ResponseDescription<200, GetComposerSuccessResponse>
type NotFoundOutput = ResponseDescription<404, GetComposerNotFoundResponse>
type ServerErrorOutput = ResponseDescription<500, PersistencyFailureResponse>

type Dependencies = {
  agent: AgentInterface
}
