/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import { body, endpoint, queryParams, request, response } from '@airtasker/spot'

import { PersistencyFailureResponse } from '../error-responses'
import { Track } from './entities'

/**
 * Get contents of a folder
 */
@endpoint({
  method: 'GET',
  path: '/browse/folder-contents',
  tags: ['browsing'],
})
export class GetFolderContents {
  @request
  request(
    @queryParams
    queryParams: {
      /** Must be the absolute path to the folder */
      folder: string
    },
  ) {}

  /**
   * Success
   */
  @response({ status: 200 })
  success(@body body: GetFolderContentsSuccessResponse) {}

  /**
   * The folder was not found
   */
  @response({ status: 404 })
  notFound(@body body: GetFolderContentsNotFoundResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

/** A desc */
export interface GetFolderContentsSuccessResponse {
  success: true

  /** Each string represents the absolute path to the subfolder */
  subfolders: string[]

  /** The collection of tracks directly contained by the folder */
  tracks: Track[]
}

export interface GetFolderContentsNotFoundResponse {
  success: false
  error: {
    message: 'FOLDER_NOT_FOUND'
  }
}
