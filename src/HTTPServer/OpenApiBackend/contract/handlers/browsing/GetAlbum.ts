import { AgentInterface } from '@Agent'
import { isLeft } from 'fp-ts/lib/Either'

import {
  GetAlbumNotFoundResponse,
  GetAlbumSuccessResponse,
} from '../../endpoints/browsing/get-album'
import { PersistencyFailureResponse } from '../../endpoints/error-responses'
import { Handler, ResponseDescription } from '../types'
import { agentTracksToAlbum } from './utils/agentTracksToAlbum'
import { agentTrackToBrowsingTrack } from './utils/agentTrackToBrowsingTrack'
import { sortAgentTracks } from './utils/sortAgentTracks'

export const GetAlbum = ({
  agent,
}: Dependencies): Handler<
  {},
  { albumArtist: string; title: string },
  {},
  SuccessOutput | NotFoundOutput | ServerErrorOutput
> => async (_, request) => {
  const allTracksByAlbumResult = await agent.query.allTracksByAlbum({
    albumArtist: request.query.albumArtist,
    title: request.query.title,
  })

  if (isLeft(allTracksByAlbumResult)) {
    switch (allTracksByAlbumResult.left) {
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

  const tracks = sortAgentTracks(allTracksByAlbumResult.right)

  if (tracks.length === 0) {
    return {
      status: 404,
      body: {
        success: false,
        error: {
          message: 'ALBUM_NOT_FOUND',
        },
      },
    }
  }

  return {
    status: 200,
    body: {
      success: true,
      album: {
        ...agentTracksToAlbum(tracks),
        tracks: tracks.map(agentTrackToBrowsingTrack),
      },
    },
  }
}

type SuccessOutput = ResponseDescription<200, GetAlbumSuccessResponse>
type NotFoundOutput = ResponseDescription<404, GetAlbumNotFoundResponse>
type ServerErrorOutput = ResponseDescription<500, PersistencyFailureResponse>

type Dependencies = {
  agent: AgentInterface
}
