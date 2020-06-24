import { AgentInterface } from '@Agent'
import { agentTracksToAlbumsList } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/agentTracksToAlbumsList'
import { agentTrackToBrowsingTrack } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/agentTrackToBrowsingTrack'
import { sortAgentTracks } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/sortAgentTracks'
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
> => async (context) => {
  const allTracksByComposerResult = await agent.query.allTracksByComposer({
    name: context.request.params.name as string,
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

  const tracks = sortAgentTracks(allTracksByComposerResult.right)

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
        name: context.request.params.name as string,
        albums: agentTracksToAlbumsList(tracks),
        tracks: tracks.map(agentTrackToBrowsingTrack),
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
