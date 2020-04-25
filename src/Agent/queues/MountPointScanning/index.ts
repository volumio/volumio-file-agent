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
                `[COMPLETED - %d ms - %d files in %d folders - %d errors] %s`,
                report.duration.toFixed(2),
                report.totalFiles,
                report.folders.length,
                report.errors.length,
                mountPointID,
              )
          }
          registeredHandlersByMountPoint.delete(mountPointID)
        })

        debug.info.enabled && debug.info(`[ENQUEUED] %s`, mountPointID)
      }

      return promise
    },
  }
}

export type MountPointScanningQueue = {
  add: (mountPointID: string) => Promise<ExecutionReport>
}
