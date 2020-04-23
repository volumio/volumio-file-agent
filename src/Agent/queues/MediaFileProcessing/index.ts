import { MediaFile } from '@ports/Database'
import { queue } from 'async'
import { isLeft, isRight } from 'fp-ts/lib/Either'
import path from 'path'

import { debug } from './debug'
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

            if (debug.info.enabled && isRight(report.result)) {
              debug.info.enabled &&
                debug.info(
                  `Completed processing of file "%s" in %d ms`,
                  mediaFilePath,
                  report.duration,
                )
            } else if (debug.error.enabled && isLeft(report.result)) {
              debug.error(
                `Encountered error while processing file %s: %s`,
                mediaFilePath,
                typeof report.result.left === 'string'
                  ? report.result.left
                  : report.result.left.message,
              )
            }
          }
          registeredHandlersByMediaFilePath.delete(mediaFilePath)
        })

        debug.info.enabled &&
          debug.info(`Enqueued processing of file %s`, mediaFilePath)
      }

      return promise
    },
  }
}

export type MediaFileProcessingQueue = {
  add: (mediaFile: MediaFile) => Promise<ExecutionReport>
}
