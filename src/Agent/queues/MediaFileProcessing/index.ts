import { MediaFile } from '@ports/Database'
import { queue } from 'async'
import path from 'path'

import { Dependencies, Execution, ExecutionReport } from './Execution'

export const MediaFileProcessingQueue = ({
  db,
  processMediaFile,
}: Dependencies): MediaFileProcessingQueue => {
  const registeredHandlersByMediaFilePath = new Map<
    string,
    ((report: ExecutionReport) => void)[]
  >()

  const internalQueue = queue(Execution({ db, processMediaFile }), 300)

  return {
    add: async (mediaFile) => {
      const mediaFilePath = path.resolve(mediaFile.id.folder, mediaFile.id.name)

      const shouldEnqueue =
        registeredHandlersByMediaFilePath.has(mediaFilePath) === false

      const promise = new Promise<ExecutionReport>((resolve) => {
        registeredHandlersByMediaFilePath.set(
          mediaFilePath,
          (
            registeredHandlersByMediaFilePath.get(mediaFilePath) || []
          ).concat((report) => resolve(report)),
        )
      })

      if (shouldEnqueue) {
        internalQueue.push<ExecutionReport>(mediaFile, (_, report) => {
          const handlers = registeredHandlersByMediaFilePath.get(mediaFilePath)
          if (report && handlers) {
            handlers.forEach((fn) => fn(report))
          }
          registeredHandlersByMediaFilePath.delete(mediaFilePath)
        })
      }

      return promise
    },
  }
}

export type MediaFileProcessingQueue = {
  add: (mediaFile: MediaFile) => Promise<ExecutionReport>
}
