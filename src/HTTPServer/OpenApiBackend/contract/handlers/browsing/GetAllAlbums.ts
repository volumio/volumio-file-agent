import { AgentInterface } from '@Agent'
import { agentTracksToAlbumsList } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/agentTracksToAlbumsList'
import { sortAgentTracks } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/sortAgentTracks'
import { isLeft } from 'fp-ts/lib/Either'

import { GetAllAlbumsSuccessResponse } from '../../endpoints/browsing/get-all-albums'
import { PersistencyFailureResponse } from '../../endpoints/error-responses'
import { Handler, ResponseDescription } from '../types'

export const GetAllAlbums = ({
  agent,
}: Dependencies): Handler<
  {},
  {},
  {},
  SuccessOutput | ServerErrorOutput
> => async () => {
  const allTracksHavingAlbumResult = await agent.query.allTracksHavingAlbum()

  if (isLeft(allTracksHavingAlbumResult)) {
    switch (allTracksHavingAlbumResult.left) {
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

  const tracks = sortAgentTracks(allTracksHavingAlbumResult.right)

  return {
    status: 200,
    body: {
      success: true,
      albums: agentTracksToAlbumsList(tracks),
    },
  }
}

type SuccessOutput = ResponseDescription<200, GetAllAlbumsSuccessResponse>
type ServerErrorOutput = ResponseDescription<500, PersistencyFailureResponse>

type Dependencies = {
  agent: AgentInterface
}
