/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import {
  body,
  endpoint,
  Float,
  Integer,
  request,
  response,
} from '@airtasker/spot'

import { PersistencyFailureResponse } from './error-responses'

/**
 * Get all known MountPoints, along with their status
 */
@endpoint({
  method: 'GET',
  path: '/mount-points',
  tags: ['mount-points'],
})
export class GetAllMountPoints {
  @request
  request() {}

  /**
   * Success
   */
  @response({ status: 200 })
  success(@body body: GetAllMountPointsSuccessResponse) {}

  /**
   * Persistency failure
   */
  @response({ status: 500 })
  persistencyFailure(@body body: PersistencyFailureResponse) {}
}

export interface GetAllMountPointsSuccessResponse {
  success: true
  mountPoints: MountPointWithStats[]
}

interface MountPointWithStats {
  path: string
  mediaFiles: {
    total: Integer
    errored: Integer
    pending: Integer
    processed: Integer
  }
  music: {
    totalDuration: Float
    totalArtists: Integer
    totalAlbums: Integer
  }
}
