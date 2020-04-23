import { queue } from 'async'

import { debug } from './debug'
import { Dependencies, Execution, ExecutionReport } from './Execution'

export const MountPointScanningQueue = ({
  fs,
}: Dependencies): MountPointScanningQueue => {
  const registeredHandlersByMountPoint = new Map<
    string,
    ((report: ExecutionReport) => void)[]
  >()

  const internalQueue = queue(
    Execution({ fs }),
    /**
     * We do execute filesystem scan through `find` serially
     */
    1,
  )

  return {
    add: async (mountPointID) => {
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
                `Completed scanning of mount point "%s" in %d ms. Found %d files in %d folders. Had %d errors`,
                mountPointID,
                report.duration,
                report.totalFiles,
                report.folders.length,
                report.errors.length,
              )
          }
          registeredHandlersByMountPoint.delete(mountPointID)
        })

        debug.info.enabled &&
          debug.info(`Enqueued scanning of mount point %s`, mountPointID)
      }

      return promise
    },
  }
}

export type MountPointScanningQueue = {
  add: (mountPointID: string) => Promise<ExecutionReport>
}
