import { AgentInterface } from '@Agent'
import { agentTracksToAlbumsList } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/agentTracksToAlbumsList'
import { agentTrackToBrowsingTrack } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/agentTrackToBrowsingTrack'
import { sortAgentTracks } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/sortAgentTracks'
import { isLeft } from 'fp-ts/lib/Either'

import {
  GetArtistNotFoundResponse,
  GetArtistSuccessResponse,
} from '../../endpoints/browsing/get-artist'
import { PersistencyFailureResponse } from '../../endpoints/error-responses'
import { Handler, ResponseDescription } from '../types'

export const GetArtist = ({
  agent,
}: Dependencies): Handler<
  { name: string },
  {},
  {},
  SuccessOutput | NotFoundOutput | ServerErrorOutput
> => async (context) => {
  const allTracksByArtistResult = await agent.query.allTracksByArtist({
    name: context.request.params.name as string,
  })

  if (isLeft(allTracksByArtistResult)) {
    switch (allTracksByArtistResult.left) {
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

  const tracks = sortAgentTracks(allTracksByArtistResult.right)

  if (tracks.length === 0) {
    return {
      status: 404,
      body: {
        success: false,
        error: {
          message: 'ARTIST_NOT_FOUND',
        },
      },
    }
  }

  return {
    status: 200,
    body: {
      success: true,
      artist: {
        name: context.request.params.name as string,
        albums: agentTracksToAlbumsList(tracks),
        tracks: tracks.map(agentTrackToBrowsingTrack),
      },
    },
  }
}

type SuccessOutput = ResponseDescription<200, GetArtistSuccessResponse>
type NotFoundOutput = ResponseDescription<404, GetArtistNotFoundResponse>
type ServerErrorOutput = ResponseDescription<500, PersistencyFailureResponse>

type Dependencies = {
  agent: AgentInterface
}
