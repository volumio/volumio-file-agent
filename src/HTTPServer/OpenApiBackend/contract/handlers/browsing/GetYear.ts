import { AgentInterface } from '@Agent'
import { agentTracksToAlbumsList } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/agentTracksToAlbumsList'
import { isLeft } from 'fp-ts/lib/Either'

import { GetYearSuccessResponse } from '../../endpoints/browsing/get-year'
import { PersistencyFailureResponse } from '../../endpoints/error-responses'
import { Handler, ResponseDescription } from '../types'
import { sortAgentTracks } from './utils/sortAgentTracks'

export const GetYear = ({
  agent,
}: Dependencies): Handler<
  {},
  { artist: string; title: string },
  {},
  SuccessOutput | ServerErrorOutput
> => async (context) => {
  const year = parseInt(context.request.params.num as string, 10)

  const allTracksByYearResult = await agent.query.allTracksByYear(year)
  if (isLeft(allTracksByYearResult)) {
    switch (allTracksByYearResult.left) {
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
  const tracks = sortAgentTracks(allTracksByYearResult.right)
  return {
    status: 200,
    body: {
      success: true,
      year: {
        number: year,
        albums: agentTracksToAlbumsList(tracks),
      },
    },
  }
}

type SuccessOutput = ResponseDescription<200, GetYearSuccessResponse>

type ServerErrorOutput = ResponseDescription<500, PersistencyFailureResponse>

type Dependencies = {
  agent: AgentInterface
}
