import { MediaFile } from '@ports/Database'
import { queue } from 'async'

import { Dependencies, Execution, ExecutionReport } from './Execution'

export const MediaFileProcessingQueue = ({
  db,
  processMediaFile,
}: Dependencies): MediaFileProcessingQueue => {
  const internalQueue = queue(Execution({ db, processMediaFile }), 100)

  return {
    add: async (mediaFile) => {
      return new Promise((resolve) => {
        internalQueue.push<ExecutionReport>(mediaFile, (_, report) => {
          resolve(report)
        })
      })
    },
  }
}

export type MediaFileProcessingQueue = {
  add: (mediaFile: MediaFile) => Promise<ExecutionReport>
}
