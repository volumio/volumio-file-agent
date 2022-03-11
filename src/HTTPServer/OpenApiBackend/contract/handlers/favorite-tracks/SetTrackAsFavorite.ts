import { AgentInterface } from '@Agent'
import { agentTrackToBrowsingTrack } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/agentTrackToBrowsingTrack'
import { isLeft } from 'fp-ts/lib/Either'

import { PersistencyFailureResponse } from '../../endpoints/error-responses'
import {
  SetTrackAsFavoriteNotFoundResponse,
  SetTrackAsFavoriteRequestBody,
  SetTrackAsFavoriteSuccessResponse,
} from '../../endpoints/favorite-tracks/set-track-as-favorite'
import { Handler, ResponseDescription } from '../types'

export const SetTrackAsFavorite = ({
  agent,
}: Dependencies): Handler<
  {},
  {},
  SetTrackAsFavoriteRequestBody,
  SuccessOutput | NotFoundOutput | ServerErrorOutput
> => async (_, request) => {
  const setFavoriteStateOfTrackResult = await agent.command.setFavoriteStateOfTrack(
    request.body.track.file.path,
    true,
  )

  if (isLeft(setFavoriteStateOfTrackResult)) {
    switch (setFavoriteStateOfTrackResult.left) {
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
      case 'TRACK_NOT_FOUND':
        return {
          status: 404,
          body: {
            success: false,
            error: {
              message: 'TRACK_NOT_FOUND',
            },
          },
        }
    }
  }

  return {
    status: 200,
    body: {
      success: true,
      track: agentTrackToBrowsingTrack(setFavoriteStateOfTrackResult.right),
    },
  }
}

type SuccessOutput = ResponseDescription<200, SetTrackAsFavoriteSuccessResponse>
type NotFoundOutput = ResponseDescription<
  404,
  SetTrackAsFavoriteNotFoundResponse
>
type ServerErrorOutput = ResponseDescription<500, PersistencyFailureResponse>

type Dependencies = {
  agent: AgentInterface
}
