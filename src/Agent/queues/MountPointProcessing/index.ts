import { queue } from 'async'

import { debug } from './debug'
import { Dependencies, Execution, ExecutionReport } from './Execution'

export const MountPointProcessingQueue = ({
  processFolder,
  scanMountPoint,
}: Dependencies): MountPointProcessingQueue => {
  const registeredHandlersByMountPoint = new Map<
    string,
    ((report: ExecutionReport) => void)[]
  >()

  const internalQueue = queue(Execution({ processFolder, scanMountPoint }), 3)

  return {
    add: (mountPointID) => {
      const shouldEnqueue =
        registeredHandlersByMountPoint.has(mountPointID) === false

      const promise = new Promise<ExecutionReport>((resolve) => {
        registeredHandlersByMountPoint.set(
          mountPointID,
          (
            registeredHandlersByMountPoint.get(mountPointID) || []
          ).concat((report) => resolve(report)),
        )
      })

      if (shouldEnqueue) {
        internalQueue.push<ExecutionReport>(mountPointID, (_, report) => {
          const handlers = registeredHandlersByMountPoint.get(mountPointID)
          if (report && handlers) {
            handlers.forEach((fn) => fn(report))

            debug.info.enabled &&
              debug.info(
                `Completed processing of mount point "%s" in %d ms. %d media files were updated, %d media files were removed`,
                mountPointID,
                report.duration,
                report.updatedMediaFilesOnDB,
                report.deletedMediaFilesFromDB,
              )
          }
          registeredHandlersByMountPoint.delete(mountPointID)
        })

        debug.info.enabled &&
          debug.info(`Enqueued processing of mount point %s`, mountPointID)
      }

      return promise
    },
    getEnqueuedMountPoints: () => {
      return [...registeredHandlersByMountPoint.keys()].sort()
    },
  }
}

export type MountPointProcessingQueue = {
  add: (mountPointID: string) => Promise<ExecutionReport>
  getEnqueuedMountPoints: () => string[]
}
