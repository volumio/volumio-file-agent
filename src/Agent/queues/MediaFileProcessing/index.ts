import { queue } from 'async'
import { isLeft, isRight } from 'fp-ts/lib/Either'
import path from 'path'

import { MediaFile } from '../../ports/Persistency'
import { debug } from './debug'
import { Dependencies, Execution, ExecutionReport } from './Execution'

export const MediaFileProcessingQueue = ({
  persistency,
  processMediaFile,
}: Dependencies): MediaFileProcessingQueue => {
  const registeredHandlersByMediaFilePath = new Map<
    string,
    ((report: ExecutionReport) => void)[]
  >()

  const internalQueue = queue(Execution({ persistency, processMediaFile }), 15)

  return {
    add: async (mediaFile) => {
      const mediaFilePath = path.resolve(mediaFile.folder, mediaFile.name)

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
                  `[PROCESSED - %d ms] %s`,
                  report.duration.toFixed(2),
                  mediaFilePath,
                )
            } else if (debug.error.enabled && isLeft(report.result)) {
              debug.error(
                `[ERROR] "%s" while processing file %s`,
                typeof report.result.left === 'string'
                  ? report.result.left
                  : report.result.left.message,
                mediaFilePath,
              )
            }
          }
          registeredHandlersByMediaFilePath.delete(mediaFilePath)
        })

        debug.info.enabled && debug.info(`[ENQUEUED] %s`, mediaFilePath)
      }

      return promise
    },
  }
}

export type MediaFileProcessingQueue = {
  add: (mediaFile: MediaFile) => Promise<ExecutionReport>
}
