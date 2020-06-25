import { AgentInterface } from '@Agent'
import { agentTrackToBrowsingTrack } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/agentTrackToBrowsingTrack'
import { sortAgentTracks } from '@HTTPServer/OpenApiBackend/contract/handlers/browsing/utils/sortAgentTracks'
import { isLeft } from 'fp-ts/lib/Either'

import {
  GetFolderContentsNotFoundResponse,
  GetFolderContentsSuccessResponse,
} from '../../endpoints/browsing/get-folder-contents'
import { PersistencyFailureResponse } from '../../endpoints/error-responses'
import { Handler, ResponseDescription } from '../types'
export const GetFolderContents = ({
  agent,
}: Dependencies): Handler<
  {},
  { folder: string },
  {},
  SuccessOutput | NotFoundOutput | ServerErrorOutput
> => async (_, request) => {
  const [allTracksInFolderResult, folderSubfoldersResult] = await Promise.all([
    agent.query.allTracksInFolder(request.query.folder),
    agent.query.folderSubfolders(request.query.folder),
  ])

  if (isLeft(allTracksInFolderResult)) {
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

  if (isLeft(folderSubfoldersResult)) {
    return {
      status: 404,
      body: {
        success: false,
        error: {
          message: 'FOLDER_NOT_FOUND',
        },
      },
    }
  }

  const tracks = sortAgentTracks(allTracksInFolderResult.right)

  return {
    status: 200,
    body: {
      success: true,
      subfolders: folderSubfoldersResult.right.sort(),
      tracks: tracks.map(agentTrackToBrowsingTrack),
    },
  }
}

type SuccessOutput = ResponseDescription<200, GetFolderContentsSuccessResponse>
type NotFoundOutput = ResponseDescription<
  404,
  GetFolderContentsNotFoundResponse
>
type ServerErrorOutput = ResponseDescription<500, PersistencyFailureResponse>

type Dependencies = {
  agent: AgentInterface
}
