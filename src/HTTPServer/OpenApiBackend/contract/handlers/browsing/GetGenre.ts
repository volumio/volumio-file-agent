import { AgentInterface } from '@Agent'
import { agentTracksToAlbumsList } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/agentTracksToAlbumsList'
import { agentTracksToArtistsList } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/agentTracksToArtistsList'
import { sortAgentTracks } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/sortAgentTracks'
import { isLeft } from 'fp-ts/lib/Either'

import {
  GetGenreNotFoundResponse,
  GetGenreSuccessResponse,
} from '../../endpoints/browsing/get-genre'
import { PersistencyFailureResponse } from '../../endpoints/error-responses'
import { Handler, ResponseDescription } from '../types'

export const GetGenre = ({
  agent,
}: Dependencies): Handler<
  { name: string },
  {},
  {},
  SuccessOutput | NotFoundOutput | ServerErrorOutput
> => async (context) => {
  const allTracksByGenreResult = await agent.query.allTracksByGenre({
    name: context.request.params.name as string,
  })

  if (isLeft(allTracksByGenreResult)) {
    switch (allTracksByGenreResult.left) {
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

  const tracks = sortAgentTracks(allTracksByGenreResult.right)

  if (tracks.length === 0) {
    return {
      status: 404,
      body: {
        success: false,
        error: {
          message: 'GENRE_NOT_FOUND',
        },
      },
    }
  }

  return {
    status: 200,
    body: {
      success: true,
      genre: {
        name: context.request.params.name as string,
        albums: agentTracksToAlbumsList(tracks),
        artists: agentTracksToArtistsList(tracks),
      },
    },
  }
}

type SuccessOutput = ResponseDescription<200, GetGenreSuccessResponse>
type NotFoundOutput = ResponseDescription<404, GetGenreNotFoundResponse>
type ServerErrorOutput = ResponseDescription<500, PersistencyFailureResponse>

type Dependencies = {
  agent: AgentInterface
}
